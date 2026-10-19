# 星海换肤 · Codex Starfield Skin

独立的 Windows Codex 壁纸引擎与 Skill。自带原创建图「洪荒星海」，支持自己的 PNG / JPEG / WebP、阅读区透明度、离线预览、诊断、应用、持续重应用和恢复。无需 Codex Dream Skin 或其他 Skill，没有 npm 运行依赖。

**状态：0.1.0 实验版。** 已通过离线测试，并收到 Windows Codex `26.1013.4894.0` 用户的首次背景显示正常反馈；尚未覆盖所有页面、窗口尺寸与版本。当前只实现 Windows Microsoft Store 的 OpenAI.Codex。不是 OpenAI 官方产品。

## 使用

解压后可双击 `Preview.cmd` 看离线预览。CDP 已开启时双击 `Apply.cmd` 会先诊断再应用；`Restore.cmd` 移除本工具样式。运行前需要 Node.js 22+。若应用失败，窗口会保留具体错误，不会自动关闭或重启 Codex。

安装 Node.js 22 或更新版本，下载本仓库并在目录中运行：

```powershell
node scripts/skin.mjs configure
node scripts/skin.mjs preview
```

预览命令输出可在浏览器打开的本地 HTML 路径。换自己的图：

```powershell
node scripts/skin.mjs configure --image "D:\Pictures\wallpaper.png" --opacity 0.84 --blur 12
```

要应用到真实 Codex，先保存工作并自行退出 Codex，然后运行：

```powershell
powershell -NoProfile -File scripts/launch-codex.ps1 -Port 9341
node scripts/skin.mjs doctor
node scripts/skin.mjs apply
```

启动器不强制退出任何程序。若系统执行策略拒绝脚本，请在遵守本机策略的前提下处理，不需要关闭安全软件。若 Codex 已由其他工具以相同端口启动，可直接 doctor。其他皮肤工具应先通过其自身功能恢复外观，避免叠加样式。

希望页面跳转后继续应用，可在独立终端运行：

```powershell
node scripts/skin.mjs watch
```

保持终端打开。Ctrl+C 停止监视；刷新后样式会消失，除非监视器仍运行。监视器每 2.5 秒检查一次，暂时可能有原生外观闪烁，不包含后台自启动服务或托盘程序。

## 诊断与恢复

doctor 分别输出端口所属进程身份、应用版本、识别到的窗口数量、各结构标记、样式和图片加载状态。未识别窗口时不会写入样式；输出中不包含聊天内容或完整调试目标列表。

先停止 watch，再运行：

```powershell
node scripts/skin.mjs restore
```

恢复仅删除本工具的样式，不修改原生外观配置。要关闭调试端口，请自行退出 Codex，然后正常打开。不会修改 WindowsApps、app.asar、账号、模型配置或对话数据库。CDP 即使只监听本机，也能被其他本机程序连接；不用时应关闭。

## 作为 Skill 使用

将整个项目目录复制到 `$CODEX_HOME/skills/codex-starfield-skin`（通常为 `~/.codex/skills/codex-starfield-skin`）。确认目录中有 SKILL.md、scripts 和 assets。重新加载技能后输入：

```text
使用 $codex-starfield-skin 检查兼容性并设置洪荒星海背景。
```

Skill 会遵守执行环境权限；无法操作桌面应用的环境不会因安装此 Skill 获得额外权限。

## 开发与发布

```powershell
npm test
```

可选的真实浏览器测试：另行安装 Playwright 和其 Chromium 后执行 `node tests/browser-check.mjs`。也可通过 `STARFIELD_BROWSER_CHANNEL=chrome` 使用已安装 Chrome。这只操作项目构造的测试页，不连接桌面 Codex。

代码和渲染器为本项目独立实现，没有复用 Codex Dream Skin 的代码。兼容选择器属于针对应用结构的观察。代码采用 MIT；原创 AI 背景的说明见 [ASSETS-LICENSE.md](ASSETS-LICENSE.md)。本仓库不附带任何账号、用户配置或运行日志。

首版不承诺任意未来版本兼容。发现 `RENDERER_UNRECOGNIZED` 时，请提交应用版本和 marker 布尔值，勿上传聊天截图或凭据。发布时只提交 Git 跟踪的文件，不要打包本地状态目录。
