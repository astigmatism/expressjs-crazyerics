module.exports = {
    apps : [
        {
            name: "crazyerics",
            script: "/home/astigmatism/expressjs-crazyerics/app.js",
            env: {
                "NODE_ENV": "production"
            },
            instances: -1,
            exec_mode: "cluster"
        }
    ]
}