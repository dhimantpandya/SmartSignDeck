import net from "net";

const ports = [465, 587, 25];
const host = "smtp.gmail.com";

console.log(`--- TCP Port Test to ${host} ---`);

async function testPort(port: number) {
    return new Promise((resolve) => {
        console.log(`Testing Port ${port}...`);
        const socket = new net.Socket();
        const timeout = 5000;

        socket.setTimeout(timeout);

        socket.connect(port, host, () => {
            console.log(`✅ Port ${port} is OPEN!`);
            socket.destroy();
            resolve(true);
        });

        socket.on("error", (err) => {
            console.error(`❌ Port ${port} is CLOSED or BLOCKED: ${err.message}`);
            socket.destroy();
            resolve(false);
        });

        socket.on("timeout", () => {
            console.error(`❌ Port ${port} TIMED OUT after ${timeout}ms`);
            socket.destroy();
            resolve(false);
        });
    });
}

const run = async () => {
    for (const port of ports) {
        await testPort(port);
    }
    process.exit();
};

run();
