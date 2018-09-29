# drone-sonarqube-setting [![Build Status](https://travis-ci.org/zongwei007/drone-sonarqube-setting.svg?branch=master)](https://travis-ci.org/zongwei007/drone-sonarqube-setting)

用于生产 sonarqube 扫描配置文件 `sonar-project.properties`。支持 `npm` 和 `maven` 项目。

生成的 `sonar-project.properties` 基本格式为：

* sonar.projectKey 对应 git 仓库名:git 分支名
* sonar.projectName git 仓库名:git 分支名
* sonar.branch.name git 分支名
* sonar.login 插件 `SONAR_LOGIN` 环境变量

其余属性会从插件参数中获取，规则为：

* 不需声明 sonar 前缀
* 按 `.` 以对象形式表达数据结构，如 sonar.host.url 表达为 `host: { url: "url" }`
* 可以使用数组表示多值，最终会通过 `,` 拼接

配置样例：

```yml
setting-sonarqube:
  image: knives/drone-sonarqube-setting
  secrets: [ sonar_login ]
  host:
    url: https://sonar.com
  exclusions:
    - assets/**
```
