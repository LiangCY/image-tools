# GitHub Pages 部署指南

本项目已配置为自动部署到 GitHub Pages。以下是完整的部署步骤和说明。

## 🚀 自动部署设置

### 1. 推送代码到 GitHub

首先，确保你的代码已经推送到 GitHub 仓库：

```bash
# 如果还没有初始化 git 仓库
git init
git add .
git commit -m "Initial commit with GitHub Pages deployment setup"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/image-tool.git
git branch -M main
git push -u origin main
```

### 2. 启用 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**
5. 保存设置

### 3. 自动部署

一旦你推送代码到 `main` 分支，GitHub Actions 会自动：

1. 检出代码
2. 安装 Node.js 和依赖
3. 构建项目
4. 部署到 GitHub Pages

你可以在仓库的 **Actions** 标签中查看部署进度。

## 📁 项目配置说明

### Vite 配置

项目已配置了正确的 base 路径：

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/image-tool/' : '/',
  // ...
})
```

这确保了在 GitHub Pages 的子路径下正确加载资源。

### GitHub Actions 工作流

`.github/workflows/deploy.yml` 文件配置了自动部署流程：

- **触发条件**: 推送到 `main` 分支或手动触发
- **构建环境**: Ubuntu 最新版本，Node.js 18
- **部署目标**: GitHub Pages

## 🌐 访问你的应用

部署完成后，你的应用将在以下地址可用：

```
https://YOUR_USERNAME.github.io/image-tool/
```

请将 `YOUR_USERNAME` 替换为你的 GitHub 用户名。

## 🔧 本地开发

在本地开发时，使用以下命令：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📝 自定义配置

### 修改仓库名称

如果你的仓库名称不是 `image-tool`，需要更新 `vite.config.ts` 中的 base 路径：

```typescript
base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
```

### 自定义域名

如果你想使用自定义域名：

1. 在仓库根目录创建 `public/CNAME` 文件
2. 在文件中添加你的域名（如 `example.com`）
3. 在你的域名提供商处配置 DNS 记录

## 🐛 故障排除

### 部署失败

1. 检查 GitHub Actions 日志中的错误信息
2. 确保所有依赖都在 `package.json` 中正确声明
3. 验证构建命令 `npm run build` 在本地能正常工作

### 资源加载问题

如果部署后资源无法加载：

1. 检查 `vite.config.ts` 中的 base 路径是否正确
2. 确保路径以 `/` 开头和结尾（如 `/image-tool/`）

### 路由问题

对于单页应用的路由问题，GitHub Pages 默认不支持客户端路由。如果需要支持，可以：

1. 使用 Hash 路由
2. 或者添加 404.html 重定向到 index.html

## 📚 更多资源

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)