const params = new URLSearchParams(window.location.search);
const videoId = params.get('videoId');
const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;
const BASE_URL = 'http://localhost:4500';
let videoCreatorId = localStorage.getItem('videoCreatorId') || '';

$().ready(function () {
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

    function getCommentHTML(comment) {
        return `
            <div class="comment">
              <img src="${comment.user.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp'}" 
              onerror="this.onerror=null;this.src='https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp';" 
              alt="${comment.user.firstname} ${comment.user.lastname}">
              <div class="comment-content">
                <strong>${comment.user.firstname} ${comment.user.lastname}</strong> <small class="text-muted">${formatDate(comment.commentedAt)}</small>
                <p>${comment.comment}</p>
              </div>
            </div>
        `;
    }

    function getOtherVideoHTML(video) {
        return `
        <div class="sidebar-item">
            <img src="${video.thumbnailUrl}"
            onerror="this.onerror=null;this.src='https://tastetorialmedia.blob.core.windows.net/thumbnail/5c10e8bc-f60c-498e-9b17-129e0743d9c4.jpeg';"
            >
            <div>
              <strong>${video.title}</strong><br>
              <small>${formatNumbers(video.views, 'views')} · ${formatDate(video.createdAt)}</small>
            </div>
          </div>
        `;
    }

    async function viewVideo() {
        try {
            const response = await axios.post(`${BASE_URL}/api/view-video/${videoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Video viewed:', response.data.data);
        } catch (error) {
            console.error('Error viewing video:', error);
        }
    }

    async function loadVideoDetails() {
        try {
            $('#placeholder-container').show();
            $('#real-container').hide();
            const response = await axios.get(`${BASE_URL}/api/videos/${videoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const video = response.data.data;

            localStorage.setItem('videoCreatorId', video.creator.id);

            $('#video-title').text(video.title);
            $('#video-description').text(video.description);
            $('#video-author').text(video.creator.firstname + ' ' + video.creator.lastname);
            $('#video-author-name').text(video.creator.firstname + ' ' + video.creator.lastname);
            $('#video-views').text(formatNumbers(video.views, 'views'));
            $('#video-likes').text(formatNumbers(video.likes, 'likes'));
            $('#video-comments').text(formatNumbers(video.comments, 'comments'));
            $('#video-created-at').text(formatDate(video.createdAt));
            $('#video-followers').text(formatNumbers(video.creator.followers, 'followers'));
            // $('#video-tags').text(video.tags.map(tag => `#${tag}`).join(' '));

            $('#video-author-img')
                .attr('src', video.creator.avatar || 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp')
                .on('error', function () {
                    $(this).attr('src', 'https://tastetorialmedia.blob.core.windows.net/avatar/54c7a2d1-a22a-4d95-b29d-62f78df39bd0.webp');
                });


            $('#video-player').attr('poster', video.thumbnailUrl);
            $('#video-player source').attr('src', video.videoUrl);
            const player = $('#video-player')[0];
            player.load();
            player.play();

            const commentsContainer = $('#comments-section');
            commentsContainer.empty();

            video.reactions.forEach(comment => {
                commentsContainer.append(getCommentHTML(comment));
            });

            const otherVideosContainer = $('#more-videos');
            otherVideosContainer.empty();

            otherVideos = video.creator.videos

            if (otherVideos && otherVideos.length > 0) {
                otherVideos.forEach(v => {
                    const videoHtml = getOtherVideoHTML(v);
                    otherVideosContainer.append(videoHtml);
                });
            } else {
                otherVideosContainer.append('<p>No other videos from this creator.</p>');
            }


            if (user && user.id === video.creator.id) {
                $('#follow-btn').hide();
            } else {
                $('#follow-btn').show();
            }


            $('#placeholder-container').hide();
            $('#real-container').show();
            viewVideo();
        } catch (error) {
            console.log(error);
        }
    }

    async function checkIfLiked() {
        try {
            const response = await axios.get(`${BASE_URL}/api/is-liked/${videoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.data.liked) {
                $('#like-btn').addClass('fa-solid active').removeClass('fa-regular');
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function checkIsSaved() {
        try {
            const response = await axios.get(`${BASE_URL}/api/is-saved/${videoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.data.saved) {
                $('#save-btn').addClass('fa-solid active').removeClass('fa-regular');
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function checkIsFollowing() {
        try {
            const response = await axios.get(`${BASE_URL}/api/is-following/${videoCreatorId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log(response.data.data.following);

            if (response.data.data.following) {
                $('#follow-btn').text('Following').addClass('btn-danger').removeClass('btn-outline-danger');
            }
        } catch (error) {
            console.log(error);
        }
    }



    loadVideoDetails();

    checkIfLiked();

    checkIsSaved();

    checkIsFollowing();

    $('#comment-btn').on('click', async function () {
        const commentText = $('#comment-box').val();
        if (commentText) {
            try {
                const response = await axios.post(`${BASE_URL}/api/comment`, {
                    videoId: videoId,
                    comment: commentText
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    const newComment = response.data.data;
                    console.log('New comment added:', newComment);
                    $('#comments-section').prepend(getCommentHTML(newComment));
                }
            } catch (error) {
                console.error('Error submitting comment:', error);
            }

            console.log('Comment submitted:', commentText);
            $('#comment-box').val('');
        }
    });

    $('#comment-box').on('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            $('#comment-btn').click();
        }
    })

    $('#like-btn').on('click', async function () {
        try {
            const response = await axios.post(`${BASE_URL}/api/toggle-like/${videoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatedLikes = response.data.data;
                if (updatedLikes.like) {
                    $('#like-btn').removeClass('fa-regular').addClass('fa-solid active');
                } else {
                    $('#like-btn').removeClass('fa-solid active').addClass('fa-regular');
                }
                $('#video-likes').text(formatNumbers(updatedLikes.likes, 'likes'));
            }
        } catch (error) {
            console.error('Error liking video:', error);
        }
    });


    $('#save-btn').on('click', async function () {
        try {
            const response = await axios.post(`${BASE_URL}/api/toggle-save/${videoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatedSaves = response.data.data;
                if (updatedSaves.saved) {
                    $('#save-btn').removeClass('fa-regular').addClass('fa-solid active');
                    $('#save-text').text('Unsave');
                } else {
                    $('#save-btn').removeClass('fa-solid active').addClass('fa-regular');
                    $('#save-text').text('Save');
                }
            }
        } catch (error) {
            console.error('Error saving video:', error);
        }
    });

    $('#follow-btn').on('click', async function () {
        try {
            const response = await axios.post(`${BASE_URL}/api/toggle-follow/${videoCreatorId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                const updatedFollow = response.data.data;
                if (updatedFollow.following) {
                    $('#follow-btn').text('Following').addClass('btn-danger').removeClass('btn-outline-danger');
                } else {
                    $('#follow-btn').text('Follow').removeClass('btn-danger').addClass('btn-outline-danger');
                }
            }
        } catch (error) {
            console.error('Error following/unfollowing creator:', error);
        }
    });
});
