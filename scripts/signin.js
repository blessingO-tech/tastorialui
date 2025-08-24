const PASSWORD_LENGTH = 6
const BASE_URL = 'http://localhost:4500'
const STATUS = {
    INTIAL: 'initial',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
}

function isLoading(loading) {
    const spinner = document.getElementById('login-spinner')
    const signin = document.getElementById('signin-txt')
    const signinBtn = document.getElementById('signin-btn')

    if (loading) {
        console.log('loading')
        spinner.style.display = "block";
        signin.style.display = "none";
        signinBtn.classList.add('disabled');
    } else {
        console.log('not loading')
        spinner.style.display = "none";
        signin.style.display = "block";
        signinBtn.classList.remove('disabled');
    }
}

function showingError(elementId, errorList, show = true) {
    errorContainer = document.querySelector(elementId)

    if (show) {
        errorContainer.style.display = "block"
        errorContainer.innerHTML = ''

        for (let error of errorList) {
            const li = document.createElement('li')
            li.innerText = error
            errorContainer.appendChild(li)
        }
    } else {
        errorContainer.style.display = "none";
        errorList = [];
    }
}

async function submitForm() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    let isValid = true;
    let status = STATUS.INTIAL;
    let errorList = [];

    if (email === "") {
        errorList.push("Email cannot be empty");
        isValid = false;
    }

    if (password === "") {
        errorList.push("Password cannot be empty");
        isValid = false;
    }

    if (!isValid) {
        showingError('.error-list', errorList, true);
        return;
    }
    // Email validation (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // showingError("emailError", true);
        errorList.push("Invalid email address");
        isValid = false;
    }

    if (password.length < PASSWORD_LENGTH) {
        // showingError("passwordError", true)
        errorList.push(`Password must be at least ${PASSWORD_LENGTH} characters`);
        isValid = false;
    }

    if (!isValid) {
        showingError('.error-list', errorList, true);
        return;
    }


    try {
        isLoading(true)
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: email,
            password: password
        });

        isLoading(false)
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        localStorage.setItem("token", response.data.data.token);
        window.location.href = "home.html"
    } catch (error) {
        isLoading(false)

        errorList = [];
        errorList.push(error.response?.data.message || error.message);
        showingError('.error-list', errorList, true);
    }
}