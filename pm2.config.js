module.exports = {
    apps : [
        {
            name: "crazyerics",
            script: "./app.js",
            watch: true,
            env: {
                "NODE_ENV": "development"
            }
        }
    ]
}