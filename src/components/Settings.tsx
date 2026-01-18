import React, { useEffect, useState } from 'react';
import { Drawer, Space, InputNumber, Button, ColorPicker, message, Input, Switch, Tabs, Descriptions, Form, Tag, Alert, Table, version as antdVersion } from 'antd';
import { ProfileOutlined, AntDesignOutlined, ThunderboltOutlined } from '@ant-design/icons';
import pkg from '../../package.json';
import './Settings.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const Settings: React.FC<Props> = ({ open, onClose }) => {
  const [brandColor, setBrandColor] = useState<string>('#2563eb');
  const [outputHeight, setOutputHeight] = useState<number>(320);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [autoScrollDefault, setAutoScrollDefault] = useState(true);
  const [defaultHighlight, setDefaultHighlight] = useState('');
  const [defaultFilter, setDefaultFilter] = useState('');
  const [exportDir, setExportDir] = useState('');
  const [runtimeVersions, setRuntimeVersions] = useState<{ electron: string, react: string }>({ electron: '', react: '' });
  const [maxLogLines, setMaxLogLines] = useState<number>(2000);

  useEffect(() => {
    if (open) {
      window.electron.getSettings().then((s: any) => {
        if (s?.brandColor) setBrandColor(s.brandColor);
        if (s?.outputHeight) setOutputHeight(Number(s.outputHeight) || 320);
        if (typeof s?.darkMode === 'boolean') setDarkMode(s.darkMode);
        if (typeof s?.alwaysOnTop === 'boolean') setAlwaysOnTop(s.alwaysOnTop);
        if (typeof s?.autoScrollDefault === 'boolean') setAutoScrollDefault(s.autoScrollDefault);
        if (typeof s?.defaultHighlight === 'string') setDefaultHighlight(s.defaultHighlight);
        if (typeof s?.defaultFilter === 'string') setDefaultFilter(s.defaultFilter);
        if (typeof s?.exportDir === 'string') setExportDir(s.exportDir);
        if (typeof s?.maxLogLines === 'number') setMaxLogLines(Number(s.maxLogLines) || 2000);
      });
      const rv = (window.electron as any).getRuntimeVersions?.();
      const reactVersion = (React as any)?.version || (pkg.dependencies?.react || '').replace(/^[^0-9]*/, '') || '未知';
      setRuntimeVersions({ electron: rv?.electron || '', react: reactVersion });
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await window.electron.saveSettings({
        brandColor,
        outputHeight,
        darkMode,
        alwaysOnTop,
        autoScrollDefault,
        defaultHighlight,
        defaultFilter,
        exportDir,
        maxLogLines
      } as any);
      message.success('设置已保存');
      onClose();
    } finally {
      setLoading(false);
    }
  };
  const handleChooseDir = async () => {
    const dir = await window.electron.selectDirectory();
    if (dir) setExportDir(dir);
  };

  return (
    <Drawer
      title="设置"
      open={open}
      onClose={onClose}
      placement="left"
      width={460}
      className="settings-drawer"
      zIndex={2001}
      maskClosable
      closable={false}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
    >
      <div className="settings-tabs">
        <Tabs
          items={[
            {
              key: 'appearance',
              label: '外观',
              children: (
                <div className="settings-pane">
                  <Alert className="settings-desc" type="info" showIcon message="外观说明" description="品牌色影响按钮与主题主色；深色模式适合低光环境；窗口置顶用于保持界面最前。" />
                  <Form layout="vertical" className="settings-form">
                    <Form.Item label={<span>品牌色 <Tag color="blue">推荐</Tag></span>}>
                      <ColorPicker value={brandColor} onChange={(c) => setBrandColor(c.toHexString())} />
                    </Form.Item>
                    <Form.Item label={<span>深色模式 <Tag color="green">可选</Tag></span>}>
                      <Switch checked={darkMode} onChange={setDarkMode} />
                    </Form.Item>
                    <Form.Item label={<span>窗口置顶 <Tag color="orange">谨慎</Tag></span>}>
                      <Switch checked={alwaysOnTop} onChange={setAlwaysOnTop} />
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'output',
              label: '输出',
              children: (
                <div className="settings-pane">
                  <Alert className="settings-desc" type="info" showIcon message="输出说明" description="设置输出区固定高度；默认自动滚动便于实时查看；可预设高亮与过滤词提升定位效率。" />
                  <Form layout="vertical" className="settings-form">
                    <Form.Item label={<span>输出区高度 <Tag>建议 320px</Tag></span>}>
                      <InputNumber
                        min={160}
                        max={800}
                        step={20}
                        value={outputHeight}
                        onChange={(v) => setOutputHeight(Number(v) || 320)}
                        addonAfter="px"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item label={<span>默认自动滚动 <Tag color="blue">推荐</Tag></span>}>
                      <Switch checked={autoScrollDefault} onChange={setAutoScrollDefault} />
                    </Form.Item>
                    <Form.Item label={<span>默认高亮关键词（空格分隔） <Tag color="purple">示例：error warn</Tag></span>}>
                      <Input
                        value={defaultHighlight}
                        onChange={(e) => setDefaultHighlight(e.target.value)}
                        placeholder="如 error warn"
                      />
                    </Form.Item>
                    <Form.Item label={<span>默认过滤词 <Tag color="green">可选</Tag></span>}>
                      <Input
                        value={defaultFilter}
                        onChange={(e) => setDefaultFilter(e.target.value)}
                        placeholder="如 INFO"
                      />
                    </Form.Item>
                    <Form.Item label={<span>最大保留日志行数 <Tag color="orange">性能优化</Tag></span>}>
                      <InputNumber
                        min={200}
                        max={20000}
                        step={100}
                        value={maxLogLines}
                        onChange={(v) => setMaxLogLines(Number(v) || 2000)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'log',
              label: '日志',
              children: (
                <div className="settings-pane">
                  <Alert className="settings-desc" type="info" showIcon message="日志说明" description="设置默认导出目录，便于快速保存当前输出内容。" />
                  <Form layout="vertical" className="settings-form">
                    <Form.Item className="form-item-span2" label={<span>默认导出目录 <Tag color="blue">推荐</Tag></span>}>
                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <Input
                          style={{ flex: '1 1 auto', minWidth: 0 }}
                          value={exportDir}
                          onChange={(e) => setExportDir(e.target.value)}
                          placeholder="选择或输入目录路径"
                        />
                        <Button onClick={handleChooseDir}>选择目录</Button>
                      </div>
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'about',
              label: '关于',
              children: (
                <div className="settings-about">
                  <Alert className="settings-desc" type="success" showIcon message="关于本应用" description="遵循 ISC 许可证；使用 Ant Design、Electron 与 Vite 构建。" />
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="版本">{pkg.version}</Descriptions.Item>
                    <Descriptions.Item label="许可证">{pkg.license}</Descriptions.Item>
                  </Descriptions>
                  <Table
                    size="small"
                    style={{ marginTop: 12 }}
                    rowKey="title"
                    pagination={false}
                    dataSource={[
                      { title: 'ISC License', desc: '宽松的开源许可证', url: 'https://opensource.org/license/isc-license-txt', icon: <ProfileOutlined />, version: 'ISC' },
                      { title: 'Ant Design', desc: '一套企业级 UI 设计语言和 React 组件库', url: 'https://ant.design', icon: <AntDesignOutlined />, version: antdVersion || '未知' },
                      { title: 'Electron', desc: '使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用', url: 'https://www.electronjs.org', version: runtimeVersions.electron || '未知' },
                      { title: 'React', desc: '用于构建用户界面的库', url: 'https://react.dev', version: runtimeVersions.react || '未知' },
                      { title: 'Vite', desc: '下一代前端构建工具', url: 'https://vite.dev', icon: <ThunderboltOutlined />, version: (pkg.devDependencies?.vite || '').replace(/^[^0-9]*/, '') || '未知' },
                    ]}
                    columns={[
                      { title: '名称', dataIndex: 'title', key: 'title', render: (text, record: any) => <Space><span className="link-icon">{record.icon}</span><span>{text}</span></Space> },
                      { title: '描述', dataIndex: 'desc', key: 'desc' },
                      { title: '版本', dataIndex: 'version', key: 'version', render: (v: string) => <Tag>v{v}</Tag> },
                      { title: '链接', dataIndex: 'url', key: 'url', render: (url: string) => <Button type="link" onClick={() => window.electron.openExternal(url)}>打开</Button> },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </Drawer>
  );
}
