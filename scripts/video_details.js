const params = new URLSearchParams(window.location.search);
const videoId = params.get('videoId');
const token = localStorage.getItem('token') || '';
const user = JSON.parse(localStorage.getItem('user')) || null;
let videoCreatorId = localStorage.getItem('videoCreatorId') || '';

if (!token || !user) {
    window.location.href = 'login.html'
}

$().ready(function () {

    function getCommentHTML(comment) {
        return `
            <div class="comment">
              <img src="${comment.user.avatar || DEFAULT_AVATAR}" 
              onerror="this.onerror=null;this.src=${DEFAULT_AVATAR};" 
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
        <div class="sidebar-item shadow-sm px-2 py-2" data-video-id="${video.id}" style="cursor: pointer;">
            <img src="${video.thumbnailUrl}"
            onerror="this.onerror=null;this.src=${DEFAULT_THUMBNAIL};"
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
            $('#video-tags').text(video.tags.split(' ').map(tag => `#${tag}`).join(' '));

            $('#video-author-img')
                .attr('src', video.creator.avatar || DEFAULT_AVATAR)
                .on('error', function () {
                    $(this).attr('src', DEFAULT_AVATAR);
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

                $('.sidebar-item').on('click', function (e) {
                    const videoId = $(this).data('video-id');
                    window.location.href = `./video_details.html?videoId=${videoId}`;
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
            window.location.href = '/error.html'
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

    $('#user-avatar')
        .attr('src', user.avatar || DEFAULT_AVATAR)
        .on('error', function () {
            $(this).attr('src', DEFAULT_AVATAR);
        });


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
            alert('An error occurred while liking the video. Please try again later.');
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
            alert('An error occurred while saving the video. Please try again later.');
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
            alert('An error occurred while following/unfollowing the creator. Please try again later.')
        }
    });

});
