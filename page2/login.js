document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const loginCard = document.querySelector('.login-card');

  // Eye icons inside passwordToggle
  const eyeIcon = passwordToggle.querySelector('.eye-icon');
  const eyeOffIcon = passwordToggle.querySelector('.eye-off-icon');

  // Password visibility toggle logic
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    if (isPassword) {
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
      passwordToggle.setAttribute('aria-label', 'Hide password');
    } else {
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
      passwordToggle.setAttribute('aria-label', 'Show password');
    }
  });

  // Validation helper
  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  // Show error visually
  function showError(input, errorSpan, message) {
    input.classList.add('error-border');
    errorSpan.textContent = message;
    errorSpan.classList.add('visible');
  }

  // Clear error visual feedback
  function clearError(input, errorSpan) {
    input.classList.remove('error-border');
    errorSpan.textContent = '';
    errorSpan.classList.remove('visible');
  }

  // Real-time input validation (clearing errors as the user types)
  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim() !== '') {
      if (validateEmail(emailInput.value.trim())) {
        clearError(emailInput, emailError);
      } else {
        showError(emailInput, emailError, 'Please enter a valid email address.');
      }
    } else {
      clearError(emailInput, emailError);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length >= 6) {
      clearError(passwordInput, passwordError);
    }
  });

  // Form submit handler
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value;
    let isValid = true;

    // Reset errors
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    // Validate email
    if (emailVal === '') {
      showError(emailInput, emailError, 'Email address is required.');
      isValid = false;
    } else if (!validateEmail(emailVal)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    }

    // Validate password
    if (passwordVal === '') {
      showError(passwordInput, passwordError, 'Password is required.');
      isValid = false;
    } else if (passwordVal.length < 6) {
      showError(passwordInput, passwordError, 'Password must be at least 6 characters.');
      isValid = false;
    }

    // If validation fails, shake form
    if (!isValid) {
      loginCard.classList.remove('shake');
      // trigger reflow
      void loginCard.offsetWidth;
      loginCard.classList.add('shake');
      
      // Remove shake class after animation ends so it can shake again
      setTimeout(() => {
        loginCard.classList.remove('shake');
      }, 400);
      return;
    }

    // If validation succeeds, trigger loading state
    submitBtn.disabled = true;
    btnText.style.opacity = '0';
    btnSpinner.classList.remove('hidden');
    emailInput.disabled = true;
    passwordInput.disabled = true;
    passwordToggle.disabled = true;

    // Mock API request
    setTimeout(() => {
      // Transition to success state
      loginCard.style.transition = 'opacity 0.4s ease';
      loginCard.style.opacity = '0';
      
      setTimeout(() => {
        loginCard.innerHTML = `
          <div class="success-state" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px;">
            <div class="success-icon-wrapper" style="margin-bottom: 24px; display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: rgba(245, 197, 24, 0.1); color: var(--color-primary, #F5C518);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style="color: #ffffff; font-size: 1.8rem; font-weight: 700; margin-bottom: 12px;">Login Successful!</h2>
            <p style="color: #aeaeb2; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px; max-width: 280px;">Welcome back to your account. Redirecting you to the home page...</p>
            <div class="redirect-spinner" style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #F5C518); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          </div>
        `;
        loginCard.style.opacity = '1';

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 2000);
      }, 400);

    }, 1500);
  });
});
