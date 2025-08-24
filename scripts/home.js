$().ready(() => {
    const BASE_URL = 'http://localhost:4500'
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))

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
            <div class="col-md-4 video-card">
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

    function showPlaceholder() {
        const rows = $('main .row');

        rows.each(function () {
            for (let i = 0; i < 3; i++) {
                $(this).append(placeholderTemplate);
            }
        });
    }


    async function loadHomeVideos(page = 1, limit = 6) {
        try {
            const response = await axios.get(
                `${BASE_URL}/api/videos?page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const videos = response.data.data

            console.log(videos)

            const videoContainer = $('#home')
            videoContainer.empty()

            videos.forEach(video => {
                const videoHtml = videoTemplate(video);

                videoContainer.append(videoHtml)
            });

        } catch (error) {
            console.log(error.response.data.message || error.message)
        }
    }

    async function loadMostLikedVideos(page = 1, limit = 6) {
        try {
            const response = await axios.get(
                `${BASE_URL}/api/videos?orderBy=likes&page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const videos = response.data.data

            console.log(videos)

            const videoContainer = $('#most-liked')
            videoContainer.empty()

            videos.forEach(video => {
                const videoHtml = videoTemplate(video);
                videoContainer.append(videoHtml)
            });

        } catch (error) {
            console.log(error.response.data.message || error.message)
        }
    }


    async function loadSavedVideos(page = 1, limit = 6) {
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

            console.log(savedVideos)

            const videoContainer = $('#saved')
            videoContainer.empty()

            savedVideos.forEach(saved => {
                const videoHtml = videoTemplate(saved.video);

                videoContainer.append(videoHtml)
            });

        } catch (error) {
            console.log(error.response.data.message || error.message)
        }
    }

    $('#avatar')
        .attr('src', user.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp')
        .on('error', function () {
            $(this).attr('src', 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp');
        });


    showPlaceholder()

    loadHomeVideos()
    loadMostLikedVideos()
    loadSavedVideos()
})