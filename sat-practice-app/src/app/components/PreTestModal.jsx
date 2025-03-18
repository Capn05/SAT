import { useEffect, useState } from "react";
import { Timer, ClipboardList, Accessibility, Lock, X } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SubjectSection from "./SubjectSection";

export default function PreTestModal({ testType, onStart, onClose }) {
  const [selectedSubject, setSelectedSubject] = useState(testType); // Set initial state to null
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAvailableTests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!selectedSubject) {
          setAvailableTests([]);
          return;
        }
        
        console.log("Fetching tests for subject:", selectedSubject);
        
        // Map UI subject name to subject_id
        const subject_id = selectedSubject === "Math" ? 1 : selectedSubject === "Reading/Writing" ? 2 : null;
        
        if (!subject_id) {
          setError("Invalid subject selected");
          return;
        }
        
        // Fetch practice tests for the selected subject
        const response = await fetch(`/api/practice-tests?subject_id=${subject_id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching available tests:', errorData);
          setError(`Failed to load tests: ${errorData.error || response.statusText}`);
          return;
        }
        
        const data = await response.json();
        console.log("Fetched practice tests:", data);
        
        // Filter tests that have complete modules and haven't been completed yet
        const validTests = data.filter(test => 
          test.hasModules && 
          test.isComplete && 
          !test.completed
        );
        
        setAvailableTests(validTests);
      } catch (err) {
        console.error("Error in fetchAvailableTests:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTests();
  }, [selectedSubject]);

  const handleTestSelection = (testId) => {
    setSelectedTest(testId);
    // You can add logic to handle the selected test if needed
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value === "null" ? null : e.target.value;
    setSelectedSubject(value);
    setSelectedTest(null); // Reset selectedTest to null when subject changes
  };

  // Determine subtitle and test info based on selected subject
  const subtitle = selectedSubject === "Math" ? "Math" : selectedSubject === "Reading/Writing" ? "Reading & Writing" : "";
  const questionCount = selectedSubject === "Math" ? "20" : selectedSubject === "Reading/Writing" ? "25" : "";
  const timeLimit = selectedSubject === "Math" ? "35" : selectedSubject === "Reading/Writing" ? "32" : "";

  return (
    <div className="modal-overlay" style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.closeIcon} onClick={onClose}>
          <X style={styles.icon} />
        </div>
        <h1 style={styles.title}>Practice Test</h1>
        <h2 style={styles.subtitle}>{subtitle}</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Subject:</label>
          <select onChange={handleSubjectChange} value={selectedSubject || ''} style={styles.select}>
            <option value="" disabled>Select a subject</option>
            <option value="Math">Math</option>
            <option value="Reading/Writing">Reading & Writing</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Test:</label>
          <select 
            onChange={(e) => handleTestSelection(e.target.value)} 
            value={selectedTest || 'none'} 
            style={styles.select}
            disabled={availableTests.length === 0}
          >
            <option value="none">
              {loading ? 'Loading tests...' : 
               availableTests.length === 0 ? 'No tests available' : 'Select a test'}
            </option>
            {availableTests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </select>
          {error && <p style={styles.errorText}>{error}</p>}
          {!loading && availableTests.length === 0 && !error && selectedSubject && (
            <p style={styles.infoText}>No practice tests available for this subject.</p>
          )}
        </div>

        <div style={styles.testInfo}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Questions:</span>
            <span style={styles.infoValue}>{questionCount}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Time:</span>
            <span style={styles.infoValue}>{timeLimit} minutes</span>
          </div>
        </div>  

        {selectedSubject && selectedTest && (
          <div style={styles.startButtonContainer}>
            <button onClick={() => onStart(selectedTest)} style={styles.startButton}>
              Start
            </button>
          </div>
        )}

        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Timer style={styles.icon} />
              <h3 style={styles.sectionTitle}>Timing</h3>
            </div>
            <p style={styles.sectionText}>
              Practice tests are timed, but you can pause them. To continue on another device, you have to start over.
              We delete incomplete practice tests after 90 days.
            </p>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <ClipboardList style={styles.icon} />
              <h3 style={styles.sectionTitle}>Scores</h3>
            </div>
            <p style={styles.sectionText}>
              When you finish the practice test, go to <strong>Practice Tests</strong> to see your scores and get
              personalized study tips.
            </p>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Accessibility style={styles.icon} />
              <h3 style={styles.sectionTitle}>Assistive Technology (AT)</h3>
            </div>
            <p style={styles.sectionText}>
              Be sure to practice with any AT you use for testing. If you configure your AT settings here, you may need
              to repeat this step on test day.
            </p>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Lock style={styles.icon} />
              <h3 style={styles.sectionTitle}>No Device Lock</h3>
            </div>
            <p style={styles.sectionText}>
              We don't lock your device during practice. On test day, you'll be blocked from using other programs or
              apps.
            </p>
          </div>
        </div>

        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.backButton}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "32px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
  },
  closeIcon: {
    position: "absolute",
    top: "16px",
    right: "16px",
    cursor: "pointer",
    zIndex: 1001,
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: "500",
    color: "#4338ca",
    textAlign: "center",
    marginBottom: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "16px",
    fontWeight: "500",
    color: "#111827",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    color: "#111827",
  },
  testInfo: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "32px",
    padding: "16px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoLabel: {
    fontSize: "16px",
    color: "#6b7280",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  icon: {
    width: "24px",
    height: "24px",
    color: "#4338ca",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  sectionText: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#4b5563",
    margin: 0,
  },
  buttons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "32px",
  },
  backButton: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  startButtonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "0px",
    marginBottom: "40px",

  },
  startButton: {
    padding: "10px 20px",
    backgroundColor: "#4338ca",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "20px",
    fontWeight: "500",
    cursor: "pointer",
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '4px',
  },
  infoText: {
    color: '#6B7280',
    fontSize: '14px',
    marginTop: '4px',
  },
}

