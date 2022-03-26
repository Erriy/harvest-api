# harvest-api

## seed

```jsonc
{
  // 名字
  "name": "xxxx",
  // 统一资源标识符，可为任意url+urn或任意id
  "uri": "http://ssss",
  // 时间相关信息
  "time": {
    // 单位：毫秒
    "create": 111111, // 创建时间
    "update": null // 更新时间
  },
  // 携带内容
  "body": {
    "type": "markdown",
    "data": "# test\n\n aaaaaaa"
  },
  // 信息来源
  "source": "chrome.history",
  // 标签，中括号表示与标签的关系，花括号表示标签的唯一区别id，
  // 比如两个人物是朋友关系，可以在两个人中间打上"朋友{xxxx}"，双方就可以通过这个标签找到对方，而不会与"朋友{yyyy}"混淆
  "tags": ["xxx", "yyy", "zzz[detail]{uniq_id}"],
  "history": []
}
```
