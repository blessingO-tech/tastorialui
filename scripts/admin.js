const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
let creatorList;

if (!token || !user) {
    window.location.href = 'login.html'
}

$().ready(function () {
    $('#user-avatar')
        .attr('src', user.avatar || DEFAULT_AVATAR)
        .on('error', function () {
            $(this).attr('src', DEFAULT_AVATAR);
        });


    const getQuery = (status, search, orderBy, page = 1, limit = 30,) => {
        let path = 'api/admin/creators';

        if (search) path += path.includes('?') ? `&search=${search}` : `?search=${search}`;
        if (status) path += path.includes('?') ? `&status=${status}` : `?status=${status}`;
        if (orderBy) path += path.includes('?') ? `&orderBy=${orderBy}` : `?orderBy=${orderBy}`;
        path += path.includes('?') ? `&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;

        console.log('Generated path:', path);

        return path;
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

    function creatorTemplate(creator, no) {

        return `
        <tr>
                <th scope="row">${no}</th>
                <td>
                  <div class="col-md-3 d-flex align-items-center">
                    <img 
                    src="${creator.user.avatar || DEFAULT_AVATAR}" 
                     onerror="this.onerror=null;this.src=${DEFAULT_AVATAR};"
                    class="border rounded-circle me-2" width="40">
                    <div>
                      <span class="text-nowrap text-md">${creator.user.firstname + ' ' + creator.user.lastname}</span><br><small class="text-muted text-nowrap"></small>
                    </div>
                  </div>
                </td>
                <td>${creator.user.email}</td>
                <td>${creator.status[0].toUpperCase() + creator.status.slice(1)}</td>
                <td>
                  <div data-creator-id="${creator.id}" class="btn-group" role="group" aria-label="Basic mixed styles example">
                    <button type="button" class="view-btn btn btn-outline-primary"  data-bs-toggle="modal" data-bs-target="#viewCreatorModal">View</button>
                    <button type="button" class="approve-btn btn btn-outline-success" ${creator.status === 'pending' ? '' : 'disabled'}>Approve</button>
                    <button type="button" class="decline-btn btn btn-outline-danger" ${creator.status === 'pending' ? '' : 'disabled'}>Decline</button>
                  </div>
                </td>
              </tr>

        `
    }


    const fetchCreators = async (path) => {
        try {
            const response = await axios.get(`${BASE_URL}/${path}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const creators = response.data.data;

            return creators;
        } catch (error) {
            console.error('Error fetching creators:', error);
            window.location.href = '/error.html'
        }
    }

    async function loadCreators(status, search) {
        isLoading(true);
        const creators = await fetchCreators(getQuery(status, search));

        creatorList = creators;

        if (creators.length === 0) {
            $('#creators-table tbody').html('<tr><td colspan="5" class="text-center">No creators found</td></tr>');
        } else {
            $('#creators-table tbody')
                .empty()
                .append(creators.map((creator, i) => creatorTemplate(creator, i + 1)).join(''));
        }


        isLoading(false);
    }

    async function actionCreator(creatorId, action) {
        try {
            const response = await axios.post(`${BASE_URL}/api/admin/${action}-creator/${creatorId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            console.log(response.data);

            return response.data.status;
        } catch (error) {
            console.error('Error updating creator status:', error);
            window.location.href = '/error.html'
        }
    }

    loadCreators(null, null);

    $('.filters button').on('click', async function () {
        $('.filters button').removeClass('active');
        $(this).addClass('active');
        console.log(this.id);
        await loadCreators(this.id, null);
    });

    // $('#search-box').on('keypress', function (e) {
    //     if ($(this).val().length > 0) {
    //         if (e.key === 'Enter') {
    //             e.preventDefault();
    //             loadCreators(null, $(this).val());
    //         }
    //     } else {
    //         loadCreators(null, null);
    //     }
    // });

    $('#search-box').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();

            const query = $(this).val().trim();

            if (query.length > 0) {
                loadCreators(null, query);
            } else {
                loadCreators(null, null);
            }
        }
    });

    $('#creators-table').on('click', '.approve-btn', async function () {
        isLoading(true);

        try {
            const id = $(this).closest('[data-creator-id]').data('creator-id');
            const status = await actionCreator(id, 'approve');

            window.location.reload();
        } catch (err) {
            console.error('Error approving creator:', err);
            alert('Something went wrong while approving.');
        } finally {
            isLoading(false);
        }
    });


    $('#creators-table').on('click', '.decline-btn', async function () {
        isLoading(true);

        try {
            const id = $(this).closest('[data-creator-id]').data('creator-id');
            const status = await actionCreator(id, 'reject');

            window.location.reload();
        } catch (err) {
            console.error('Error Rejecting creator:', err);
            alert('Something went wrong while Rejecting.');
        } finally {
            isLoading(false);
        }
    });

    $('#creators-table').on('click', '.view-btn', async function () {
        const id = $(this).closest('[data-creator-id]').data('creator-id');
        const creator = creatorList.find((creator) => creator.id == id);

        if (!creator) {
            return
        }

        $('#creator-img').attr('src', creator.user.avatar || DEFAULT_AVATAR);
        $('#creator-name').text(creator.user.firstname + ' ' + creator.user.lastname);
        $('#viewCreatorName').text(creator.user.username)
        $('#viewCreatorEmail').text(creator.user.email)
        $('#viewCreatorPhone').text(creator.user.phone)
        $('#viewCreatorDob').text(new Date(creator.user.birthday).toDateString());
        $('#viewCreatorDate').text(new Date(creator.user.createdAt).toDateString());
        $('#viewCreatorStatus').text(creator.status[0].toUpperCase() + creator.status.slice(1))
        $('#viewCreatorAboutMe').text(creator.bio);
    });

});