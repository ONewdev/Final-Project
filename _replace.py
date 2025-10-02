import sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
path = Path(r'frontend/src/pages/users/Notifications.jsx')
text = path.read_text(encoding='utf-8')
start = text.index('const resolveNotificationPath =')
end = text.index('function Notifications()', start)
new_block = '''const resolveNotificationInfo = (notification) => {
  const info = { path: null, orderType: null };

  if (!notification) return info;

  const title = String(notification.title or "");
  const message = String(notification.message or "");
  const combined = f"{title} {message}";
  lowerCombined = combined.lower()
'''
