const BASE_URL = 'http://localhost:4500';
const token = localStorage.getItem('token') || '';

$().ready(function () {
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
        function formatNumbers(number, text) {
            let numberText;
            if (number >= 1000000) {
                numberText = (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M " + text;
            } else if (number >= 1000) {
                numberText = (number / 1000).toFixed(1).replace(/\.0$/, "") + "K " + text;
            } else {
                numberText = number + " " + text;
            }

            return numberText;
        }

        function formatDate(date) {
            const created = new Date(date);
            const now = new Date();
            const diffMs = now - created;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHr = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHr / 24);

            let timeText;
            if (diffDay >= 365) {
                timeText = Math.floor(diffDay / 365) + " year" + (Math.floor(diffDay / 365) > 1 ? "s" : "") + " ago";
            } else if (diffDay >= 30) {
                timeText = Math.floor(diffDay / 30) + " month" + (Math.floor(diffDay / 30) > 1 ? "s" : "") + " ago";
            } else if (diffDay >= 1) {
                timeText = diffDay + " day" + (diffDay > 1 ? "s" : "") + " ago";
            } else if (diffHr >= 1) {
                timeText = diffHr + " hour" + (diffHr > 1 ? "s" : "") + " ago";
            } else if (diffMin >= 1) {
                timeText = diffMin + " minute" + (diffMin > 1 ? "s" : "") + " ago";
            } else {
                timeText = diffSec + " second" + (diffSec > 1 ? "s" : "") + " ago";
            }

            return timeText;
        }

        return `
            <div class="col-md-4 video-card" data-video-id="${video.id}">
                <img
                src="${video.thumbnailUrl}" 
                class="thumb" 
                alt="thumbnail"
                onerror="this.onerror=null;this.src='https://tastetorialmedia.blob.core.windows.net/thumbnail/5c10e8bc-f60c-498e-9b17-129e0743d9c4.jpeg';"
                />

                <div class="d-flex align-items-start mt-2">
                <div class="video-author">
                    <img src="${video.creator.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp'}" alt="">
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

    const getQuery = (search, categoryId, orderBy, page = 1, limit = 6,) => {
        let path = 'api/videos';

        if (search) path += path.includes('?') ? `&search=${search}` : `?search=${search}`;
        if (categoryId) path += path.includes('?') ? `&categoryId=${categoryId}` : `?categoryId=${categoryId}`;
        if (orderBy) path += path.includes('?') ? `&orderBy=${orderBy}` : `?orderBy=${orderBy}`;
        path += path.includes('?') ? `&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;

        console.log('Generated path:', path);

        return path;
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

            categories.forEach(category => {
                const button = $(`<button class="btn btn-outline-secondary btn-sm">${category.name}</button>`);
                button.on('click', function (e) {
                    // e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    $('.filters button').removeClass('active');
                    $(this).addClass('active');
                    loadSearchResults(getQuery(null, category.id, '', 1, 6));
                });
                filtersContainer.append(button);
            });
        } catch (error) {
            console.log(error)
        }
    }

    async function loadSearchResults(url) {
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

        } catch (error) {
            // console.log(error.response.data.message || error.message)
            console.log(error);
        }
    }

    $('.filters #all').on('click', function (e) {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        loadSearchResults(getQuery(null, null, '', 1, 6));
    });

    $('.filters #views').on('click', function (e) {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        loadSearchResults(getQuery(null, null, 'views', 1, 6));
    });

    loadCategories();

    loadSearchResults(getQuery());


    $('.search-bar button[type="submit"]').on('click', function (e) {
        e.preventDefault();
        const search = $('.search-bar input').val();
        if (search) {
            console.log('Searching for:', search);

            const query = getQuery(search, null, '', 1, 6);

            loadSearchResults(query);
        }
    });

    $('.search-bar button[type="reset"]').on('click', function (e) {
        e.preventDefault();
        $('.search-bar input').val('');
        loadSearchResults(getQuery());
    });

    $('.search-bar input').on('input', function (e) {
        if (e.target.value === '') {
            loadSearchResults(getQuery());
        }
    })

});