export const apiHelper = async (url, method = "GET", data) => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    const options = { method, headers };
    if (data) {
        const body = JSON.stringify(data);
        options.body = body;
    }
    try {
        const request = await fetch(url, options);
        const jsonResponse = await request.json();
        return jsonResponse;
    }
    catch (e) {
        console.error(e);
    }
};
