const BASE_URL = 'http://localhost:4500';
const token = localStorage.getItem('token') || '';
console.log(token);
const user = JSON.parse(localStorage.getItem('user')) || null;

$().ready(function () {
    $('#avatar-label').css(
        'background-image',
        `url(${user.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp'})`
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
            throw error.response?.data.data || error.message;
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
                accept: "image/jpeg, image/png, image/jpg",
                filesize: 10485760
            }
        },
        messages: {
            avatar: {
                required: "Please select an image",
                accept: "Please select a valid image file (JPEG, PNG, JPG)",
                filesize: "Image size must be less than 10 MB"
            }
        },
        errorElement: "span",
        // errorPlacement: function (error, element) {
        //     error.addClass("text-danger");
        //     error.insertAfter(element);
        // },
        submitHandler: async function (form, event) {
            event.preventDefault();
            const formData = new FormData(form);
            console.log(formData);

            // isLoading(true)

            // const response = await uploadFile(formData, 'avatar')

            // const result = await updateAvatar(response.url);

            // localStorage.setItem('user', JSON.stringify(result.data));

            // isLoading(false)

            // window.location.reload();
        }
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