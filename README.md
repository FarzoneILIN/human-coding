# GitHub Pages + Firebase 标注网站

这个目录是一个纯静态标注网站，可以部署到 GitHub Pages。前端读取
`events.js` 中的 189 条待标注事件，展示 from/to、公开来源和原论文使用的
objective facts，但不包含作者的最终 operator 答案。标注结果会保存到浏览器
localStorage，并在配置 Firebase 后同步到 Firestore。

## 文件说明

- `index.html`：页面入口。
- `styles.css`：页面样式。
- `app.js`：标注逻辑、CSV 导出、Firebase 同步。
- `events.js`：由 `data/forecast/human_coding/events_to_code_objective.csv` 生成。
- `firebase-config.example.js`：Firebase Web 配置模板。
- `firebase-config.js`：默认占位配置，部署时替换。
- `firebase.rules`：Firestore 安全规则示例。

## 本地预览

从仓库根目录运行：

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/docs/human-coding/
```

## 配置 Firebase

1. 在 Firebase Console 新建项目。
2. 添加 Web App，复制 Firebase config。
3. 替换 `docs/human-coding/firebase-config.js` 中的 `window.FIREBASE_CONFIG`。
4. 在 Firebase Authentication 中启用 Anonymous 登录。
5. 在 Firestore Database 中创建数据库。
6. 将 `firebase.rules` 的内容部署为 Firestore rules。

仓库里提交的 `firebase-config.js` 是占位配置。公开部署前，需要用你的 Firebase
Web App config 覆盖它，或用 GitHub Actions 在部署产物中生成该文件。

## GitHub Pages 部署

推荐设置：

1. GitHub 仓库 Settings。
2. Pages。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/docs`。
5. 访问：

```text
https://<user-or-org>.github.io/<repo>/human-coding/
```

## Firestore 数据结构

每个标注者一个文档：

```text
human_coding_sessions/{coderId}
```

文档字段包括：

- `uid`：匿名登录 UID。
- `coderId`：标注者代号。
- `updatedAt`：最后更新时间。
- `totalEvents`：事件总数。
- `completedOperators`：已填写 operator 的数量。
- `responses`：以 `event_id` 为键的标注结果对象。

## 导出 CSV

页面有“下载 CSV”按钮。即使 Firebase 不可用，标注者也可以下载本地 CSV。
收集后的 CSV 可以继续使用原评分脚本：

```bash
python scripts/eval/score_human_coding.py --human coder_A.csv coder_B.csv
```

## 更新事件数据

如果 `events_to_code_objective.csv` 改了，重新生成 `events.js`。仓库当前已经提交
了一份最新生成的 `events.js`，通常不需要手动生成。
