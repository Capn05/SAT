#!/usr/bin/env python3
import argparse
import os
import sys
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple

import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


def fetch_data(base_url: str, email_domain: str, start_iso: str, user_id: str = None, email: str = None) -> Dict[str, Any]:
    params = {
        'emailDomain': email_domain,
        'start': start_iso,
    }
    if user_id:
        params['userId'] = user_id
    if email:
        params['email'] = email

    url = f"{base_url.rstrip('/')}/api/reports/bentonville"
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    return resp.json()


def to_dataframe(payload: Dict[str, Any]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    users = pd.DataFrame(payload.get('users', []))
    answers = pd.DataFrame(payload.get('answers', []))
    if not answers.empty:
        answers['answered_at'] = pd.to_datetime(answers['answered_at'], utc=True)
        # Normalize difficulty to title case for display consistency
        if 'difficulty' in answers.columns:
            answers['difficulty'] = answers['difficulty'].fillna('').apply(lambda x: x.title())
    return users, answers


def split_into_four_windows(df: pd.DataFrame, time_col: str) -> pd.Series:
    if df.empty:
        return pd.Series([], dtype='object')
    df_sorted = df.sort_values(time_col)
    t0 = df_sorted[time_col].min()
    t1 = df_sorted[time_col].max()
    if pd.isna(t0) or pd.isna(t1) or t0 == t1:
        return pd.Series(['Window 1'] * len(df_sorted), index=df_sorted.index)

    # Compute 4 equal-width windows across the full time range
    raw_edges = np.linspace(t0.value, t1.value, num=5)  # 4 bins → 5 edges
    edges = np.unique(raw_edges)
    if edges.size < 2:
        return pd.Series(['Window 1'] * len(df_sorted), index=df_sorted.index)

    labels = [f"Window {i}" for i in range(1, edges.size)]  # bins-1 labels
    ts_vals = df_sorted[time_col].astype('int64')

    # Use right-closed bins with include_lowest to avoid overlapping intervals
    cat = pd.cut(ts_vals, bins=edges, labels=labels, include_lowest=True, right=True)
    cat = cat.astype(object).fillna(labels[-1])
    return pd.Series(cat.values, index=df_sorted.index)


def plot_time_series(answers: pd.DataFrame, outdir: str, title: str):
    if answers.empty:
        return
    # Daily totals
    df = answers.copy()
    df['date'] = df['answered_at'].dt.tz_convert('UTC').dt.date
    daily = df.groupby('date').agg(total=('id', 'count'), correct=('is_correct', 'sum')).reset_index()

    plt.figure(figsize=(12, 6))
    sns.lineplot(data=daily, x='date', y='total', label='Questions Answered', marker='o')
    sns.lineplot(data=daily, x='date', y='correct', label='Correct Answers', marker='o')
    plt.title(title)
    plt.xlabel('Date')
    plt.ylabel('Count')
    plt.legend()
    plt.tight_layout()
    os.makedirs(outdir, exist_ok=True)
    plt.savefig(os.path.join(outdir, 'time_series.png'))
    plt.close()


def plot_bar_by_category(answers: pd.DataFrame, category_col: str, outdir: str, prefix: str, title: str):
    if answers.empty:
        return
    df = answers.copy()
    df[category_col] = df[category_col].fillna('Unknown')
    agg = df.groupby(category_col).agg(total=('id', 'count'), correct=('is_correct', 'sum')).reset_index()

    # Melt to side-by-side bars
    melted = agg.melt(id_vars=[category_col], value_vars=['total', 'correct'], var_name='metric', value_name='count')

    plt.figure(figsize=(14, 6))
    sns.barplot(data=melted, x=category_col, y='count', hue='metric')
    plt.title(title)
    plt.xlabel(category_col.replace('_', ' ').title())
    plt.ylabel('Count')
    plt.xticks(rotation=20, ha='right')
    plt.tight_layout()
    os.makedirs(outdir, exist_ok=True)
    plt.savefig(os.path.join(outdir, f'{prefix}_overall.png'))
    plt.close()

    # Split into 4 windows across the time span
    df['window'] = split_into_four_windows(df, 'answered_at')
    for window, sub in df.groupby('window'):
        agg_w = sub.groupby(category_col).agg(total=('id', 'count'), correct=('is_correct', 'sum')).reset_index()
        melted_w = agg_w.melt(id_vars=[category_col], value_vars=['total', 'correct'], var_name='metric', value_name='count')
        plt.figure(figsize=(14, 6))
        sns.barplot(data=melted_w, x=category_col, y='count', hue='metric')
        plt.title(f"{title} - {window}")
        plt.xlabel(category_col.replace('_', ' ').title())
        plt.ylabel('Count')
        plt.xticks(rotation=20, ha='right')
        plt.tight_layout()
        plt.savefig(os.path.join(outdir, f'{prefix}_{window.replace(" ", "_").lower()}.png'))
        plt.close()


def plot_subcategories_by_domain(answers: pd.DataFrame, outdir: str, title_prefix: str):
    if answers.empty:
        return
    df = answers.copy()
    df['domain'] = df['domain'].fillna('Unknown')
    df['subcategory'] = df['subcategory'].fillna('Unknown')

    for domain, sub in df.groupby('domain'):
        if sub.empty:
            continue
        agg = sub.groupby('subcategory').agg(total=('id', 'count'), correct=('is_correct', 'sum')).reset_index()
        melted = agg.melt(id_vars=['subcategory'], value_vars=['total', 'correct'], var_name='metric', value_name='count')

        plt.figure(figsize=(14, 6))
        sns.barplot(data=melted, x='subcategory', y='count', hue='metric')
        plt.title(f"{title_prefix}: {domain}")
        plt.xlabel('Subcategory')
        plt.ylabel('Count')
        plt.xticks(rotation=20, ha='right')
        plt.tight_layout()
        os.makedirs(outdir, exist_ok=True)
        safe_domain = domain.replace(' ', '_').lower()
        plt.savefig(os.path.join(outdir, f'subcategories_{safe_domain}.png'))
        plt.close()


def main():
    parser = argparse.ArgumentParser(description='Generate Bentonville analytics plots from app API')
    parser.add_argument('--base-url', required=True, help='Base URL of the running app, e.g., http://localhost:3000')
    parser.add_argument('--email-domain', default='@bentonvillek12.org')
    parser.add_argument('--start', default='2025-09-09T17:00:00.000Z', help='ISO timestamp cutoff (UTC)')
    parser.add_argument('--outdir', default='reports/bentonville')
    parser.add_argument('--user-email', help='Generate user-specific plots for this email')
    parser.add_argument('--user-id', help='Alternatively specify user id for user-specific plots')
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    # 1) General across all users
    payload = fetch_data(args.base_url, args.email_domain, args.start)
    users, answers = to_dataframe(payload)
    general_dir = os.path.join(args.outdir, 'general')
    os.makedirs(general_dir, exist_ok=True)

    # Plot 1: line plot total vs correct over time
    plot_time_series(answers, general_dir, title='All Users: Activity Over Time')

    # Plot 2: domain side-by-side bars overall and split into 4 windows
    plot_bar_by_category(answers, 'domain', general_dir, prefix='domain', title='All Users: Domain Performance')

    # Plot 3: difficulty side-by-side bars overall and split into 4 windows
    plot_bar_by_category(answers, 'difficulty', general_dir, prefix='difficulty', title='All Users: Difficulty Performance')

    # 2) User-specific (if provided)
    if args.user_email or args.user_id:
      user_payload = fetch_data(args.base_url, args.email_domain, args.start, user_id=args.user_id, email=args.user_email)
      _, user_answers = to_dataframe(user_payload)
      user_dir = os.path.join(args.outdir, 'user_specific')
      os.makedirs(user_dir, exist_ok=True)
      name = args.user_email or args.user_id or 'user'
      # Plots 4-6
      plot_time_series(user_answers, user_dir, title=f'{name}: Activity Over Time')
      plot_bar_by_category(user_answers, 'domain', user_dir, prefix='domain', title=f'{name}: Domain Performance')
      plot_bar_by_category(user_answers, 'difficulty', user_dir, prefix='difficulty', title=f'{name}: Difficulty Performance')
      # 7) Subcategory-by-domain separated plots
      plot_subcategories_by_domain(user_answers, user_dir, title_prefix=f'{name}: Subcategory Performance by Domain')

    print('Reports generated at:', os.path.abspath(args.outdir))


if __name__ == '__main__':
    main()


