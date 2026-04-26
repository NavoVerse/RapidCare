async function test() {
    try {
        console.log("Testing request-otp...");
        const res1 = await fetch('http://localhost:5000/api/v1/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test@rapidcare.com" })
        });
        const text1 = await res1.text();
        console.log("Response 1:", res1.status, text1);
    } catch(e) {
        console.error(e);
    }
}
test();
