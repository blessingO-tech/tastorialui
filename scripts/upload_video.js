const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;

if (!token || !user) {
    window.location.href = 'login.html'
}

$().ready(async function () {

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



    async function fetchCategories() {
        try {
            const response = await axios.get(`${BASE_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const categories = response.data.data;

            const categorySelect = $('#category');
            categories.forEach(category => {
                const option = `<option value="${category.id}">${category.name}</option>`;
                categorySelect.append(option);
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            window.location.href = '/error.html'
        }
    }

    fetchCategories();

    $('#video-input').on('change', function (e) {
        const file = e.target.files[0];
        const fileURL = URL.createObjectURL(file);
        console.log(fileURL);
        // showImage(fileURL);

        $('#video-upload').hide();
        $('#video-player').attr('poster', $('#thumbnail-preview').attr('src') || DEFAULT_THUMBNAIL);
        $('#video-player source').attr('src', fileURL);
        $('#video-player')[0].load();
        $('#video-player').removeClass('d-none').addClass('d-block');
    });

    $('#thumbnail-input').on('change', function (e) {
        const file = e.target.files[0];
        const fileURL = URL.createObjectURL(file);
        console.log(fileURL);

        $('#thumbnail-upload').hide();
        $('#thumbnail-preview').attr('src', fileURL);
        $('#video-player').attr('poster', fileURL || DEFAULT_THUMBNAIL);
        $('#thumbnail-preview').removeClass('d-none').addClass('d-block');
    });

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

    $('#user-avatar')
        .attr('src', user.avatar || DEFAULT_AVATAR)
        .on('error', function () {
            $(this).attr('src', DEFAULT_AVATAR);
        });

    $('#video-tags').on('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = $(this).val().trim();
            if (tag) {
                $('#tag-list').append(`<div class="input-group-text" id="btnGroupAddon" style="border: none; background: transparent;">
                  <span class="tag-text">#${tag}</span>
                  <button id="tag-${tag.toLowerCase()}" type="button" class="btn btn-sm btn-close ms-2" aria-label="Close"></button>
                </div>`);

                $(`#tag-${tag.toLowerCase()}`).on('click', function () {
                    $(this).parent().remove();
                });

                $(this).val('');
            }
        }
    });

    $('#discard-video-btn').on('click', function () {
        $('#upload-video-form')[0].reset();
        $('#video-player').addClass('d-none');
        $('#video-upload').show();
        $('#thumbnail-preview').addClass('d-none');
        $('#thumbnail-upload').show();
    });

    $('#video-description').on('input', function () {
        let length = $(this).val().length;
        $('.char-counter').text(`${length}/500`);
    });


    $('#upload-video-form').validate({
        ignore: [],
        rules: {
            title: {
                required: true,
                maxlength: 100
            },
            description: {
                required: true,
                maxlength: 500
            },
            video: {
                required: true,
                extension: "mp4|mov|avi|mkv"
            },
            thumbnail: {
                required: true,
                extension: "jpg|jpeg|png|gif"
            },
            category: {
                required: true
            }
        },
        messages: {
            title: {
                required: "Please enter a title",
                maxlength: "Title should be less than 100 characters"
            },
            description: {
                required: "Please enter a description",
                maxlength: "Description should be less than 500 characters"
            },
            video: {
                required: "Please upload a video",
                extension: "Invalid video format. Allowed formats: mp4, mov, avi, mkv"
            },
            thumbnail: {
                required: "Please upload a thumbnail",
                extension: "Invalid thumbnail format. Allowed formats: jpg, jpeg, png, gif"
            },
            category: {
                required: "Please select a category"
            }
        },
        submitHandler: async function (form, e) {
            e.preventDefault();
            isLoading(true);
            const formData = new FormData(form);

            const videoFile = formData.get("video");
            const thumbnailFile = formData.get("thumbnail");

            const videoFormData = new FormData();
            const thumbnailFormData = new FormData();

            videoFormData.append('video', videoFile);
            thumbnailFormData.append('thumbnail', thumbnailFile);

            try {
                const videoResponse = await uploadFile(videoFormData, 'video');
                const thumbnailResponse = await uploadFile(thumbnailFormData, 'thumbnail');


                const videoData = {
                    title: formData.get("title"),
                    description: formData.get('description'),
                    tags: $('#tag-list .tag-text').map(function () {
                        return $(this).text().substring(1);
                    }).get().join(' '),
                    categoryId: formData.get('category'),
                    thumbnailUrl: thumbnailResponse.url,
                    videoUrl: videoResponse.url,
                    status: "published"
                };


                const response = await axios.post(`${BASE_URL}/api/videos`, videoData, {
                    headers: { Authorization: `Bearer ${token}` }
                });


                window.location.href = 'dashboard.html';

            } catch (error) {
                isLoading(false);
                console.error('Error uploading files:', error);
                window.location.href = '/error.html'
            }
        }
    });

});
