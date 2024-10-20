// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// 创建 WebSocket 服务器实例
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false, // 可选：禁用压缩
});

// 存储所有连接的客户端
const clients = new Set();
const users = new Set();

// 处理新的 WebSocket 连接
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('有新客户端连接');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
      // 处理用户加入
      ws.username = data.username;
      users.add(ws.username);
      broadcastUserList();

      // 可选：通知其他用户
      broadcast({
        type: 'notification',
        message: `${ws.username} 加入了聊天室。`,
      });
    } else if (data.type === 'message') {
      // **在这里添加时间戳**
      const timestamp = new Date().toLocaleTimeString();

      // 广播消息，包含时间戳
      broadcast({
        type: 'message',
        username: ws.username,
        message: data.message,
        time: timestamp,
      });
    }
    // 处理其他消息类型...
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (ws.username) {
      users.delete(ws.username);
      broadcastUserList();

      // 可选：通知其他用户
      broadcast({
        type: 'notification',
        message: `${ws.username} 离开了聊天室。`,
      });
    }
    console.log('客户端已断开连接');
  });

  ws.on('error', (error) => {
    console.error(`WebSocket 错误：${error.message}`);
  });
});

// 广播用户列表
function broadcastUserList() {
  const userList = Array.from(users);
  broadcast({ type: 'userList', users: userList });
}

// 广播消息给所有客户端
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// 提供静态文件服务
app.use(express.static(__dirname + '/public'));

// 启动服务器
server.listen(8080, () => {
  console.log('服务器已启动，监听端口 8080');
});


