const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;

if (!token || !user) {
    window.location.href = 'login.html'
}

$().ready(async function () {
    const placeholderTemplate = `<div class="col-md-4 video-card" aria-hidden="true">
            <div class="placeholder-glow">
              <span class="placeholder col-12" style="height:180px; display:block; border-radius:6px;"></span>
            </div>

            <div class="d-flex align-items-start mt-2">
              <div class="video-author">
                <span class="placeholder rounded-circle" style="width:35px; height:35px; display:inline-block;"></span>
              </div>

              <div class="video-info placeholder-glow" style="margin-left:10px; flex: 1;">
                <p class="card-text">
                  <span class="placeholder col-7"></span>
                  <span class="placeholder col-4"></span>
                  <span class="placeholder col-4"></span>
                  <span class="placeholder col-6"></span>
                  <span class="placeholder col-8"></span>
                </p>
              </div>
            </div>
          </div>
`

    function showPlaceholder(num) {
        const rows = $('.row');
        rows.empty();

        rows.each(function () {
            for (let i = 0; i < num; i++) {
                $(this).append(placeholderTemplate);
            }
        });
    }

    const videoTemplate = (video) => {
        return `
            <div class="col-md-4 video-card" data-video-id="${video.id}">
                

<video class="thumb" muted preload="none" data-src="${video.videoUrl}" poster="${video.thumbnailUrl || DEFAULT_THUMBNAIL}">
    
  </video>

                <div class="d-flex align-items-start mt-2">
                <div class="video-author">
                    <img src="${video.creator.avatar || DEFAULT_AVATAR}" alt="">
                </div>
                <div class="video-info">
                    <strong>${video.title}</strong><br>
                    ${video.creator.firstname + ' ' + video.creator.lastname} 
                    <br> ${formatNumbers(video.views, 'views')} · ${formatNumbers(video.likes, 'likes')} . ${formatNumbers(video.comments, 'comments')}
                    <br> ${formatDate(video.createdAt)}
                </div>
                </div>
            </div>
            `
    }

    const getQuery = (search, categoryId, orderBy, page = 1, limit = 12,) => {
        let path = 'api/videos';

        if (search) path += path.includes('?') ? `&search=${search}` : `?search=${search}`;
        if (categoryId) path += path.includes('?') ? `&categoryId=${categoryId}` : `?categoryId=${categoryId}`;
        if (orderBy) path += path.includes('?') ? `&orderBy=${orderBy}` : `?orderBy=${orderBy}`;
        path += path.includes('?') ? `&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;

        console.log('Generated path:', path);

        return path;
    }



    function isVideoPlaying(video) {
        return (
            video &&
            video.currentTime > 0 &&      // has started
            !video.paused &&              // not paused
            !video.ended &&               // not finished
            video.readyState > 2          // data is available for playback
        );
    }

    function isMobileView() {
        return window.innerWidth <= 768;
    }

    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function playPauseVideoInView() {
        const $videos = $("video[data-src]");

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;

                if (entry.isIntersecting) {
                    if (!video.currentSrc) {
                        // lazy load source
                        const src = $(video).data("src");
                        const type = $(video).data("type") || "video/mp4";
                        $(video).append($("<source>", { src, type }));
                        video.load();
                    }
                    video.play().catch(err => console.warn("Autoplay blocked:", err));
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }, {
            threshold: 0.5
        });

        $videos.each(function () { observer.observe(this); });
    }


    async function fetchSavedVideos(page = 1, limit = 6) {
        showPlaceholder(6);

        try {
            const response = await axios.get(
                `${BASE_URL}/api/get-saved?page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const savedVideos = response.data.data

            return savedVideos.map((saved) => saved.video);
        } catch (error) {
            console.log(error.response.data.message || error.message)
            window.location.href = '/error.html'
        }
    }


    async function fetchVideos(url) {
        showPlaceholder(6);

        try {
            const response = await axios.get(
                `${BASE_URL}/${url}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const videos = response.data.data

            return videos
        } catch (error) {
            console.log(error.response.data.message || error.message)
            window.location.href = '/error.html'
        }
    }


    function renderVideos(videos) {
        try {
            const videoContainer = $('.row')
            videoContainer.empty()

            if (videos.length === 0) {
                videoContainer.append('<p>No results found</p>');
            }

            videos.forEach(video => {
                const videoHtml = videoTemplate(video);
                videoContainer.append(videoHtml)
            });

            $('.video-card').on('click', function (e) {
                const videoId = $(this).data('video-id');
                window.location.href = `./video_details.html?videoId=${videoId}`;
            })

            //Use default values for faulty images and videos
            $("video.thumb").each(function () {
                const $video = $(this);

                // ✅ check if poster is broken
                const posterUrl = $video.attr("poster");
                if (posterUrl) {
                    const img = new Image();
                    img.onerror = function () {
                        $video.attr(
                            "poster",
                            DEFAULT_THUMBNAIL
                        );
                    };
                    img.src = posterUrl;
                }

                // ✅ check if video source fails
                $video.on("error", function () {
                    if (!this.currentSrc) {
                        $(this).find("source").attr("src", DEFAULT_VIDEO);
                        this.load();
                    }
                });
            });

            //Configure autoplay for videos in view
            //Or configure play/pause on hover for desktop devices
            if (isMobileDevice()) {
                playPauseVideoInView();
            } else {
                $("video[data-src]").on("mouseenter", function () {
                    const $video = $(this);

                    if ($video.find("source").length === 0) {
                        const source = $("<source>", {
                            src: $video.data("src"),
                            type: "video/mp4"
                        });
                        $video.append(source);
                        $video[0].load();
                    }

                    $video[0].play();
                });

                $("video[data-src]").on("mouseleave", function () {
                    this.pause();
                    this.currentTime = 0;
                });
            }

        } catch (error) {
            console.log(error.response.data.message || error.message)
        }
    }

    async function loadCategories() {
        try {
            const response = await axios.get(`${BASE_URL}/api/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const categories = response.data.data;

            const filtersContainer = $('.filters');

            categories.forEach((category) => {
                const button = $(`<button class="btn btn-outline-secondary btn-sm">${category.name}</button>`);
                button.on('click', function (e) {
                    // e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    $('.filters button').removeClass('active');
                    $(this).addClass('active');

                    fetchVideos(getQuery(null, category.id, ''))
                        .then(value => {
                            renderVideos(value);
                        }).catch(error => {
                            console.log(error)
                        })
                });
                filtersContainer.append(button);
            });
        } catch (error) {
            console.log(error)
            window.location.href = '/error.html'
        }
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


    if (user.role === 'creator') {
        $('<a>')
            .attr('id', 'upload-video-link')
            .text('Create Video')
            .addClass('btn btn-outline-success me-2')
            .attr('href', './upload_video.html')
            .prependTo('#user');
    } else if (user.role === 'admin') {
        $('<a>')
            .attr('id', 'admin-link')
            .text('Admin')
            .addClass('btn btn-outline-primary me-2')
            .attr('href', './admin.html')
            .prependTo('#user');
    } else {
        $('<button>')
            .attr('id', 'upgrade-btn')
            .attr('data-bs-toggle', 'modal')
            .attr('data-bs-target', '#upgradeViewerModal')
            .text('Upgrade to Creator')
            .addClass('btn btn-secondary me-2')
            .prependTo('#user');

    }



    $('#user-avatar')
        .attr('src', user.avatar || DEFAULT_AVATAR)
        .on('error', function () {
            $(this).attr('src', DEFAULT_AVATAR);
        });


    $('.filters #all').on('click', async function (e) {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        renderVideos(await fetchVideos(getQuery(null, null, '', 1, 12)));
    });

    $('.filters #views').on('click', async function (e) {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        renderVideos(await fetchVideos(getQuery(null, null, 'views', 1, 12)));
    });

    $('.filters #saved').on('click', async function (e) {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        renderVideos(await fetchSavedVideos());
    });

    loadCategories();

    renderVideos(await fetchVideos(getQuery(null, null, '')));



    $('.search-bar button[type="submit"]').on('click', async function (e) {
        e.preventDefault();
        const search = $('.search-bar input').val();
        if (search) {
            console.log('Searching for:', search);

            const query = getQuery(search, null, '', 1, 12);

            renderVideos(await fetchVideos(query));
        }
    });

    $('.search-bar button[type="reset"]').on('click', async function (e) {
        e.preventDefault();
        $('.search-bar input').val('');
        renderVideos(await fetchVideos(getQuery()));
    });

    $('.search-bar input').on('input', async function (e) {
        if (e.target.value === '') {
            renderVideos(await fetchVideos(getQuery()));
        }
    })

    $('#creator-bio').on('input', function () {
        let length = $(this).val().length;
        $('.char-counter').text(`${length}/500`);
    });


    $('#upgrade-form').validate({
        rules: {
            bio: {
                required: true,
                maxlength: 500
            }
        },
        messages: {
            bio: {
                required: 'Please tell more about yourself',
                maxlength: 'Bio must be less than 500 characters'
            }
        },
        errorElement: "span",
        submitHandler: async function (form, e) {
            e.preventDefault();
            const bio = $('#creator-bio').val();
            const data = {
                bio: bio
            };

            $('#upgradeViewerModal').modal('hide');

            form.reset();

            isLoading(true);

            try {
                const response = await axios.post(`${BASE_URL}/api/upgrade-to-creator`, data, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.status == 200) {
                    alert('Upgrade Request sent successfully. Wait for admin approval')
                }

                console.log('Upgrade Request sent successfully. Wait for admin approval')

                isLoading(false);
            } catch (error) {
                console.log(error)
                isLoading(false);
                alert('Something went wrong. Please try again')
            }
        }
    })

});
