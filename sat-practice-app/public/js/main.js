// Navigation scroll behavior
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        if (this.getAttribute('href') === '#') return;
        
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        
        window.scrollTo({
          top: target.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
      });
    });
    
    // Mobile menu toggle (implementation depends on your UI components)
    const mobileMenuButton = document.querySelector('#mobile-menu-button');
    const mobileMenu = document.querySelector('#mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
    
    // Add scroll class to header when scrolled
    const header = document.querySelector('header');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }
    
    // Trial button click tracking (in a real app, you'd use analytics here)
    const trialButtons = document.querySelectorAll('a[href="#trial"]');
    trialButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log('Trial button clicked');
        // Here you would potentially redirect to a sign-up page
        // or open a modal for sign up
        window.location.href = '/signup.html';
      });
    });
    
    // Testimonial carousel/slider (basic implementation)
    const testimonials = document.querySelectorAll('.testimonial');
    let currentTestimonialIndex = 0;
    
    if (testimonials.length > 1) {
      const showTestimonial = (index) => {
        testimonials.forEach((testimonial, i) => {
          testimonial.classList.toggle('hidden', i !== index);
        });
      };
      
      // Initialize
      showTestimonial(currentTestimonialIndex);
      
      // Next/Prev buttons
      const prevButton = document.querySelector('.testimonial-prev');
      const nextButton = document.querySelector('.testimonial-next');
      
      if (prevButton) {
        prevButton.addEventListener('click', () => {
          currentTestimonialIndex = (currentTestimonialIndex - 1 + testimonials.length) % testimonials.length;
          showTestimonial(currentTestimonialIndex);
        });
      }
      
      if (nextButton) {
        nextButton.addEventListener('click', () => {
          currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
          showTestimonial(currentTestimonialIndex);
        });
      }
      
      // Auto rotate testimonials
      setInterval(() => {
        currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
        showTestimonial(currentTestimonialIndex);
      }, 8000);
    }
  });
  
  // Simulated practice question functionality
  const setupPracticeQuestions = () => {
    const answerButtons = document.querySelectorAll('.question-answer');
    const hintButton = document.querySelector('.question-hint');
    const nextQuestionButton = document.querySelector('.next-question');
    
    if (answerButtons.length) {
      answerButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove selected class from all buttons
          answerButtons.forEach(btn => btn.classList.remove('bg-green-500', 'bg-red-500'));
          
          // Check if answer is correct (simulated - in real app would check against actual answer)
          const isCorrect = this.dataset.correct === 'true';
          
          // Add appropriate class
          this.classList.add(isCorrect ? 'bg-green-500' : 'bg-red-500');
          
          // Show explanation if available
          const explanationElement = document.querySelector('.question-explanation');
          if (explanationElement) {
            explanationElement.classList.remove('hidden');
          }
          
          // Enable next question button
          if (nextQuestionButton) {
            nextQuestionButton.disabled = false;
          }
        });
      });
    }
    
    // Hint button functionality
    if (hintButton) {
      hintButton.addEventListener('click', function() {
        const hintElement = document.querySelector('.question-hint-text');
        if (hintElement) {
          hintElement.classList.toggle('hidden');
        }
      });
    }
    
    // Next question button functionality
    if (nextQuestionButton) {
      nextQuestionButton.addEventListener('click', function() {
        // In a real app, this would load the next question from an API or database
        alert('This would load the next question in a real implementation');
      });
    }
  };
  
  // Call this function if the practice question UI is present on the page
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.question-answer')) {
      setupPracticeQuestions();
    }
  });