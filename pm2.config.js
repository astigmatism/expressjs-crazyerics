module.exports = {
    apps : [
        {
            name: "crazyerics",
            script: "./app.js",
            watch: true,
            env: {
                "NODE_ENV": "production"
            },
            instances: -1,
            exec_mode: "cluster"
        }
    ]
}