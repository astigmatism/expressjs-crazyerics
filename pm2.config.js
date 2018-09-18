module.exports = {
    apps : [
        {
            name: "crazyerics",
            script: "./app.js",
            watch: true,
            env: {
                "PORT": 3000,
                "NODE_ENV": "development"
            }
        }
    ]
}