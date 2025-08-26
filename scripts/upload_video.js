const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;
const BASE_URL = 'http://localhost:4500';

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
        }
    }

    fetchCategories();

    $('#video-input').on('change', function (e) {
        const file = e.target.files[0];
        const fileURL = URL.createObjectURL(file);
        console.log(fileURL);
        // showImage(fileURL);

        $('#video-upload').hide();
        $('#video-player').attr('poster', $('#thumbnail-preview').attr('src') || 'https://tastetorialmedia.blob.core.windows.net/thumbnail/5c10e8bc-f60c-498e-9b17-129e0743d9c4.jpeg');
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
        $('#video-player').attr('poster', fileURL || 'https://tastetorialmedia.blob.core.windows.net/thumbnail/5c10e8bc-f60c-498e-9b17-129e0743d9c4.jpeg');
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
        .attr('src', user.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp')
        .on('error', function () {
            $(this).attr('src', 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp');
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


                window.location.href = 'search.html';

            } catch (error) {
                isLoading(false);
                console.error('Error uploading files:', error);
            }
        }
    });

});