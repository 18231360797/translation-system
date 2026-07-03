export const Footer = () => {
  return (
    <footer className="bg-primary-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">翻译系统</h3>
            <p className="text-sm">提供多语种互译、翻译记忆库、语料库和实时字幕功能。</p>
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">功能</h3>
            <ul className="text-sm space-y-2">
              <li><a href="/translate" className="hover:text-accent-400 transition-colors">文本翻译</a></li>
              <li><a href="/memory" className="hover:text-accent-400 transition-colors">翻译记忆</a></li>
              <li><a href="/corpus" className="hover:text-accent-400 transition-colors">语料库</a></li>
              <li><a href="/subtitle" className="hover:text-accent-400 transition-colors">实时字幕</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">支持的语种</h3>
            <ul className="text-sm space-y-2">
              <li>中文、英文、日文、韩文</li>
              <li>法语、德语、西班牙语</li>
              <li>俄语、葡萄牙语、意大利语</li>
              <li>阿拉伯语、印地语、泰语等</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">关于我们</h3>
            <p className="text-sm">致力于为语言学习者提供准确、便捷的翻译服务。</p>
          </div>
        </div>
        <div className="border-t border-primary-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2026 翻译系统. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
