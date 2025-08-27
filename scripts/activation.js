$().ready(() => {
    async function activateAccount() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const loading = $('.loading-container')
        const success = $('.success-container')
        const fail = $('.fail-container')

        try {
            const response = await axios.post(`${BASE_URL}/api/auth/activate?token=${token}`)
            // Redirect to login after 3 seconds

            if (response.data.status) {
                loading.hide();
                success.show();

                setTimeout(() => {
                    window.location.href = "/signin.html";
                }, 3000);
            } else {
                throw new Error(response.data.message)
            }
        } catch (error) {
            loading.hide();
            fail.show();
            console.log(error.response?.data.message || error.message)

            $('.error-text').text(error.response?.data.message || error.message)
        }
    }

    activateAccount();

    $('#retry').click(() => {
        window.location.reload()
    })
})