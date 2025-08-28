const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;

if (!token || !user) {
    window.location.href = 'login.html'
}

$().ready(async function () {
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
        $('#aboutme').show()
        $('#bio').val(user.creator.bio || '');
    } else {
        $('#aboutme').show()
        $('#bio').val('');
    }

    $('#action-btn').on('click', function (e) {
        const $btn = $(this);

        if ($btn.text() === 'Edit') {
            e.preventDefault();

            $btn.attr('type', 'submit')
                .text('Save')
                .removeClass('btn-secondary')
                .addClass('btn-primary');

            $('#bio-form input, #bio-form textarea').prop('disabled', false);
            if (!$('#cancel-btn').length) {
                $('<button>')
                    .attr('id', 'cancel-btn')
                    .attr('type', 'button')
                    .text('Cancel')
                    .addClass('btn btn-sm btn-danger ms-2')
                    .insertAfter($btn)
                    .on('click', function () {
                        $('#bio-form input, #bio-form textarea').prop('disabled', true);
                        $btn.attr('type', 'button')
                            .text('Edit')
                            .removeClass('btn-primary')
                            .addClass('btn-secondary');
                        $('#cancel-btn').remove();
                    });
            }
        }
    });





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
                const updatedUser = response.data.data
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
    function showMyVideosPlaceholder(num) {
        const videoList = $('#video-list')
        videoList.empty()
        for (let i = 0; i < num; i++) {
            videoList.append(`<div class="sidebar-item d-flex align-items-center placeholder-glow" aria-hidden="true">
            <div class="placeholder me-2" style="width: 120px; height: 70px; border-radius: 10px;"></div>
            <div class="flex-grow-1">
              <span class="placeholder col-10 mb-2"></span><br>
              <span class="placeholder col-8"></span>
            </div>
          </div>`)
        }
    }

    function myVideosTemplate(video) {
        return `
        <div class="sidebar-item shadow-sm px-2 py-2" data-video-id="${video.id}">
            <img 
            src="${video.thumbnailUrl || DEFAULT_THUMBNAIL}"
            alt="thumbnail"
              onerror="this.onerror=null;this.src=${DEFAULT_THUMBNAIL};"
            >
            <div>
              <strong>${video.title}</strong><br>
              <small>${formatNumbers(video.views, 'views')} · ${formatNumbers(video.likes, 'likes')} . ${formatNumbers(video.comments, 'comments')}</small><br>
              <small>${formatDate(video.createdAt)}</small><br>
              <small class="text-muted">${video.status}</small>
            </div>
          </div>

        `
    }

    const getQuery = (status, page = 1, limit = 6,) => {
        let path = 'api/my-videos';

        if (status) path += path.includes('?') ? `&status=${status}` : `?status=${status}`;
        path += path.includes('?') ? `&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;

        return path;
    }


    async function getMyVideos(path) {
        showMyVideosPlaceholder(3)

        try {
            const response = await axios.get(`${BASE_URL}/${path}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            return response.data.data
        } catch (error) {
            console.log('Error while fetching videos: ', error)
        }
    }

    function renderMyVideos(videos) {
        const videoList = $('#video-list')
        videoList.empty()

        if (videos.length === 0) {
            videoList.append('<h3 class="text-center text-muted">No videos found</h3>')
            return
        } else {
            videos.forEach(video => {
                videoList.append(myVideosTemplate(video))
            });

            $('.sidebar-item').on('click', function (e) {
                const videoId = $(this).data('video-id');
                window.location.href = `./video_details.html?videoId=${videoId}`;
            });
        }
    }

    if (user.role === 'creator') {
        $('#creator-corner').show()
        const videos = await getMyVideos(getQuery())
        renderMyVideos(videos)

        $('.filters button').on('click', async function (e) {
            $('.filters button').removeClass('active');
            $(this).addClass('active');

            const videos = await getMyVideos(getQuery(this.id))
            renderMyVideos(videos)
        });
    } else {
        $('#creator-corner').hide()
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
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const result = await updateProfile('api/update-profile', data);
            localStorage.setItem('user', JSON.stringify(result));
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


    $('#logout-btn').on('click', function () {
        localStorage.removeItem('token');   // remove token
        window.location.href = '/login.html';
    });

})