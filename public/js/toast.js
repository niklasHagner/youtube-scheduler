// Toast notification utility
export function showToast(message) {
  let toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

// Add toast styles
if (!document.getElementById('custom-toast-style')) {
  const style = document.createElement('style');
  style.id = 'custom-toast-style';
  style.innerHTML = `
    .custom-toast {
      position: fixed;
      left: 50%;
      bottom: 40px;
      transform: translateX(-50%) translateY(100px);
      background: #222;
      color: #fff;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      opacity: 0;
      transition: all 0.5s cubic-bezier(.4,2,.6,1);
      z-index: 9999;
      pointer-events: none;
    }
    .custom-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(style);
}