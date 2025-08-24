const BASE_URL = 'http://localhost:4500'

$().ready(function () {
    function isLoading(loading) {
        const $spinner = $('#signup-spinner');
        const $signup = $('#signup-txt');
        const $signupBtn = $('#signup-btn');

        if (loading) {
            console.log('loading');
            $spinner.show();
            $signup.hide();
            $signupBtn.addClass('disabled');
        } else {
            console.log('not loading');
            $spinner.hide();
            $signup.show();
            $signupBtn.removeClass('disabled');
        }
    }

    $("#signup-form").validate({
        rules: {
            firstname: {
                required: true,
                minlength: 2
            },
            lastname: {
                required: true,
                minlength: 2
            },
            email: {
                required: true,
                email: true
            },
            phone: {
                required: true,
                digits: true,
                minlength: 10
            },
            password: {
                required: true,
                minlength: 8
            },
            confirmPassword: {
                required: true,
                minlength: 8,
                equalTo: "#password"
            },
            agree: "required"
        },
        messages: {
            firstname: {
                required: "Please enter your first name",
                minlength: "Your first name must be at least 2 characters long"
            },
            lastname: {
                required: "Please enter your last name",
                minlength: "Your last name must be at least 2 characters long"
            },
            email: {
                required: "Please enter your email address",
                email: "Please enter a valid email address"
            },
            phone: {
                required: "Please enter your phone number",
                digits: "Your phone number must contain only digits",
                minlength: "Your phone number must be at least 10 digits long"
            },
            password: {
                required: "Please enter a password",
                minlength: "Your password must be at least 8 characters long"
            },
            confirmPassword: {
                required: "Please confirm your password",
                minlength: "Your password must be at least 8 characters long",
                equalTo: "Your passwords do not match"
            },
            agree: "Please accept our terms and conditions"
        },
        submitHandler: function (form) {
            const formData = new FormData(form);

            const data = Object.fromEntries(formData.entries());

            isLoading(true)

            axios.post(`${BASE_URL}/api/auth/register`, data)
                .then(response => {
                    isLoading(false);
                    localStorage.setItem('user', JSON.stringify(response.data.data))
                    window.location.href = 'auth_screen.html'
                })
                .catch(error => {
                    console.error("❌ Error:", error.response?.data || error.message);
                    $('.alert>span').text(error.response?.data.message || error.message);
                    $('.alert').addClass('show');
                    isLoading(false);

                    setTimeout(() => {
                        $('.alert').removeClass('show');
                    }, 3000)
                });
        }

    })
})