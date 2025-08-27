const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;

$().ready(function () {
    $('#avatar-label').css(
        'background-image',
        `url(${user.avatar || DEFAULT_AVATAR})`
    );
    $('#firstname').val(user.firstname);
    $('#lastname').val(user.lastname);
    $('#username').val(user.username);
    $('#email').val(user.email);
    $('#phone').val(user.phone);
    $('#birthday').val(user.birthday);
    $('#role')
        .text(user.role[0].toUpperCase() + user.role.slice(1).toLowerCase())
        .addClass(user.role === 'creator' ? 'text-bg-success' : 'text-bg-secondary');

    if (user.role === 'creator') {
        $('#bio').show().val(user.creator.bio || '');
    } else {
        $('#bio').hide().val('');
    }



    function isLoading(loading) {
        const $overlay = $('#loading-overlay');
        if (loading) {
            $('body').css('overflow', 'hidden');
            $overlay.show();
        } else {
            $overlay.hide();
            $('body').css('overflow', 'auto');
        }
    }

    async function updateProfile(path, data) {
        isLoading(true);

        try {
            const response = await axios.post(`${BASE_URL}/${path}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                const updatedUser = response.data
                isLoading(false);

                return updatedUser;
            }
        } catch (error) {
            isLoading(false);
            console.log(error);
            window.location.href = '/error.html'
        }
    }

    async function uploadFile(formData, type) {
        try {
            const response = await axios.post(`${BASE_URL}/api/uploads/${type}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            return response.data.data;
        } catch (error) {
            console.error(error);
            // throw error.response?.data.data || error.message;
            window.location.href = '/error.html'
        }
    }

    async function updateAvatar(url) {
        try {
            const response = await axios.post(`${BASE_URL}/api/update-profile`, {
                avatar: url
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                const updatedUser = response.data

                return updatedUser;
            }
        } catch (error) {
            console.log(error);
            window.location.href = '/error.html'
        }
    }


    $('#bio-form').validate({
        rules: {
            firstname: {
                required: false,
                minlength: 2, // ✅ lowercase
            },
            lastname: {
                required: false,
                minlength: 2,
            },
            username: {
                required: false,
                minlength: 2,
            },
            email: {
                required: false,
                email: true
            },
            birthday: {
                required: false,
                date: true
            },
            bio: {
                required: false,
                maxlength: 500
            }
        },
        messages: {
            firstname: {
                minlength: 'First name must be at least 2 characters'
            },
            lastname: {
                minlength: 'Last name must be at least 2 characters'
            },
            username: {
                minlength: 'Username must be at least 2 characters'
            },
            email: {
                email: 'Invalid email'
            },
            birthday: {
                date: 'Invalid date'
            },
            bio: {
                maxlength: 'Bio must be at most 500 characters'
            }
        },
        errorElement: "span",
        submitHandler: async function (form, e) {
            e.preventDefault();
            console.log('submitting...');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log(data);
            const result = await updateProfile('api/update-profile', data);
            console.log(result.data);
            localStorage.setItem('user', JSON.stringify(result.data));
            window.location.href = 'edit_profile.html';
        }
    });

    $('#password-form').validate({
        rules: {
            oldPassword: {
                required: true,
                minlength: 6
            },
            newPassword: {
                required: true,
                minlength: 6
            },
            confirmNewPassword: {
                required: true,
                minlength: 6,
                equalTo: '[name=newPassword]'
            }
        },
        messages: {
            oldPassword: {
                required: 'Old password is required',
            },
            newPassword: {
                required: 'New password is required',
                minlength: 'Password must be at least 6 characters'
            },
            confirmNewPassword: {
                required: 'Confirm password is required',
                minlength: 'Password must be at least 6 characters',
                equalTo: 'Passwords do not match'
            }
        },
        errorElement: "span",
        submitHandler: async function (form, e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log(data);
            const result = await updateProfile('api/auth/change-password', data);
            console.log(result);
            // window.location.href = 'edit_profile.html';
        }
    })


    $.validator.addMethod("filesize", function (value, element, param) {
        if (element.files.length === 0) return true; // ignore if no file selected
        return element.files[0].size <= param;
    }, "File size must be less than {0} bytes.");

    $('#upload-form').validate({
        ignore: [],
        rules: {
            avatar: {
                required: true,
                extension: "jpg|jpeg|png|gif", // ✅
                filesize: 10485760      // 10 MB
            }
        },
        messages: {
            avatar: {
                required: "Please select an image",
                extension: "Please select a valid image file (JPEG, JPG, PNG, GIF)",
                filesize: "Image size must be less than 10 MB"
            }
        },
        errorElement: "span",

        submitHandler: async function (form, event) {
            event.preventDefault();
            try {
                const formData = new FormData(form);

                isLoading(true)
                const response = await uploadFile(formData, 'avatar')
                const result = await updateAvatar(response.url);
                localStorage.setItem('user', JSON.stringify(result.data));
                isLoading(false)
                window.location.reload();
            } catch (error) {
                console.log(error);
                alert('Something went wrong')
            }
        }
    });


    $('#upload-btn').on('click', function (e) {
        e.preventDefault();
        $('#upload-form').trigger('submit');
    });


    $('#avatar').on('change', function () {
        if (this.files && this.files[0]) {
            $('#avatar-label').css(
                'background-image',
                `url(${URL.createObjectURL(this.files[0])})`
            );
        }
    });

})