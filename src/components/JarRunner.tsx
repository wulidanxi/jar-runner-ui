import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import './JarRunner.css';
import { Button, Input, Space, Typography, Card, message } from 'antd';
import { List as VList, useDynamicRowHeight } from 'react-window';
import {
  CloseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  VerticalAlignBottomOutlined,
  SwapOutlined,
  MinusOutlined,
  BorderOutlined,
  MenuOutlined,
} from '@ant-design/icons';
const LazySettings = lazy(() => import('./Settings').then(m => ({ default: m.Settings })));

const JarRunner: React.FC = () => {
  const [jarPath, setJarPath] = useState('');
  const [argsText, setArgsText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<Parameters<typeof VList>[0]["listRef"]>(null) as any;
  const dynamicRowHeight = useDynamicRowHeight({ defaultRowHeight: 22, key: 'output-log' });
  const dumpTagRef = useRef<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [filterText, setFilterText] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outputHeight, setOutputHeight] = useState<number>(320);
  const [maxLogLines, setMaxLogLines] = useState<number>(2000);
  useEffect(() => {
    window.electron.getSettings().then((s: any) => {
      if (typeof s?.autoScrollDefault === 'boolean') setIsAutoScroll(s.autoScrollDefault);
      if (typeof s?.defaultHighlight === 'string') setHighlightText(s.defaultHighlight);
      if (typeof s?.defaultFilter === 'string') setFilterText(s.defaultFilter);
      if (typeof s?.maxLogLines === 'number') setMaxLogLines(Number(s.maxLogLines) || 2000);
    });
  }, []);
  const handleCloseWindow = () => {
    window.electron.send('window-close');
  };

  useEffect(() => {
    window.electron.on('jar-output', (data: string) => {
      setOutputLines((prev) => {
        const next = [...prev, data];
        if (next.length > maxLogLines) {
          const overflowCount = next.length - maxLogLines;
          const dumpText = next.slice(0, overflowCount).join('');
          (window.electron as any).dumpLog(dumpText, jarPath, dumpTagRef.current).catch(() => { });
          return next.slice(overflowCount);
        }
        return next;
      });
      if (/JAR 进程已结束/.test(data)) {
        setIsRunning(false);
        if (startRef.current) setElapsedMs(Date.now() - startRef.current);
        dumpTagRef.current = '';
      }
    });
    return () => {
      window.electron.removeAllListeners('jar-output');
    };
  }, []);

  const filteredLines = filterText.trim()
    ? outputLines.filter((l) =>
      l.toLowerCase().includes(filterText.toLowerCase())
    )
    : outputLines;

  useEffect(() => {
    if (isAutoScroll && filteredLines.length > 0) {
      listRef.current?.scrollToRow({ index: filteredLines.length - 1, align: 'smart' });
    }
  }, [filteredLines, isAutoScroll]);

  const handleSelectJar = async () => {
    const selected = await window.electron.selectJarFile();
    if (selected) {
      setJarPath(selected);
    }
  };

  const handleStart = () => {
    if (!jarPath) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    dumpTagRef.current = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    setStartTime(Date.now());
    startRef.current = Date.now();
    setElapsedMs(0);
    const args = argsText
      .split(' ')
      .map((s) => s.trim())
      .filter(Boolean);
    window.electron.startJar(jarPath, args);
    setIsRunning(true);
    setOutputLines((prev) => {
      const next = [...prev, `\n正在启动 JAR: ${jarPath}\n`];
      if (next.length > maxLogLines) {
        const overflowCount = next.length - maxLogLines;
        const dumpText = next.slice(0, overflowCount).join('');
        (window.electron as any).dumpLog(dumpText, jarPath, dumpTagRef.current).catch(() => { });
        return next.slice(overflowCount);
      }
      return next;
    });
  };

  const handleStop = () => {
    window.electron.stopJar();
    setIsRunning(false);
    if (startRef.current) setElapsedMs(Date.now() - startRef.current);
    setStartTime(null);
    startRef.current = null;
    setOutputLines((prev) => {
      const next = [...prev, '\n正在停止 JAR 进程...\n'];
      if (next.length > maxLogLines) {
        const overflowCount = next.length - maxLogLines;
        const dumpText = next.slice(0, overflowCount).join('');
        (window.electron as any).dumpLog(dumpText, jarPath, dumpTagRef.current).catch(() => { });
        return next.slice(overflowCount);
      }
      return next;
    });
    dumpTagRef.current = '';
  };

  const handleScrollToBottom = () => {
    if (filteredLines.length > 0) {
      listRef.current?.scrollToRow({ index: filteredLines.length - 1, align: 'smart' });
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScroll((v) => {
      const next = !v;
      if (next && filteredLines.length > 0) {
        listRef.current?.scrollToRow({ index: filteredLines.length - 1, align: 'smart' });
      }
      return next;
    });
  };

  const clearOutput = () => {
    setOutputLines([]);
  };
  const handleMinWindow = () => {
    window.electron.send('window-min');
  };
  const handleMaxWindow = () => {
    window.electron.send('window-max');
  };
  useEffect(() => {
    window.electron.getSettings().then((s: any) => {
      if (s?.outputHeight) setOutputHeight(Number(s.outputHeight) || 320);
    });
    window.electron.on('settings-updated', (s: any) => {
      if (s?.outputHeight) setOutputHeight(Number(s.outputHeight) || 320);
      if (typeof s?.autoScrollDefault === 'boolean') setIsAutoScroll(s.autoScrollDefault);
      if (typeof s?.defaultHighlight === 'string') setHighlightText(s.defaultHighlight);
      if (typeof s?.defaultFilter === 'string') setFilterText(s.defaultFilter);
      if (typeof s?.maxLogLines === 'number') setMaxLogLines(Number(s.maxLogLines) || 2000);
    });
    return () => {
      window.electron.removeAllListeners('settings-updated');
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRunning && startTime) {
      timer = setInterval(() => {
        setElapsedMs(Date.now() - (startRef.current || startTime));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, startTime]);

  const formatMs = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const hh = h > 0 ? String(h).padStart(2, '0') + ':' : '';
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${hh}${mm}:${ss}`;
  };

  const handleCopyAll = async () => {
    const text = outputLines.join('');
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制全部日志');
    } catch {
      message.error('复制失败');
    }
  };

  const handleExportLog = async () => {
    const text = outputLines.join('');
    const ok = await window.electron.saveLog(text);
    if (ok) {
      message.success('日志已导出');
    } else {
      message.info('已取消保存');
    }
  };

  const escapeReg = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderLine = (line: string) => {
    if (!highlightText.trim()) return line;
    const keys = highlightText
      .split(' ')
      .map((k) => k.trim())
      .filter(Boolean)
      .map(escapeReg);
    if (keys.length === 0) return line;
    const regex = new RegExp(`(${keys.join('|')})`, 'gi');
    const parts = line.split(regex);
    return (
      <>
        {parts.map((p, i) =>
          regex.test(p) ? (
            <span key={i} className="hl">{p}</span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </>
    );
  };



  return (
    <div className="container">
      <div className="titlebar">
        <div className="titlebar-controls">
          <Button
            className="window-button min-button"
            type="text"
            icon={<MinusOutlined />}
            onClick={handleMinWindow}
          />
          <Button
            className="window-button max-button"
            type="text"
            icon={<BorderOutlined />}
            onClick={handleMaxWindow}
          />
          <Button
            className="window-button close-button"
            type="text"
            icon={<CloseOutlined />}
            onClick={handleCloseWindow}
          />
        </div>
      </div>
      <Space style={{ margin: '0 0 16px' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setSettingsOpen(true)}
        >
          菜单
        </Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          JAR 运行器
        </Typography.Title>
      </Space>

      <div className="content">
        <Card className="section" title="选择与参数">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="JAR 文件路径"
                value={jarPath}
                onChange={(e) => setJarPath(e.target.value)}
                allowClear
              />
              <Button icon={<FolderOpenOutlined />} onClick={handleSelectJar}>
                选择 JAR
              </Button>
            </Space.Compact>
            <Input
              placeholder="命令行参数（用空格分隔）"
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              allowClear
            />
          </Space>
        </Card>

        <Card className="section" title="控制">
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              disabled={!jarPath || isRunning}
            >
              运行 JAR
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
              disabled={!isRunning}
            >
              停止运行
            </Button>
            <Button icon={<DeleteOutlined />} onClick={clearOutput}>
              清空输出
            </Button>
            <Typography.Text type={isRunning ? 'success' : 'secondary'}>
              运行时长：{elapsedMs > 0 || isRunning ? formatMs(elapsedMs) : '—'}
            </Typography.Text>
          </Space>
        </Card>

        <Card className="section output-section" title="输出" styles={{ body: { display: 'flex', flexDirection: 'column' } }}>
          <div className="output-controls">
            <Space wrap>
              <Input
                placeholder="过滤"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                allowClear
                style={{ width: 180 }}
              />
              <Input
                placeholder="高亮关键词（空格分隔）"
                value={highlightText}
                onChange={(e) => setHighlightText(e.target.value)}
                allowClear
                style={{ width: 240 }}
              />
              <Button icon={<VerticalAlignBottomOutlined />} onClick={handleScrollToBottom}>
                滚动到底部
              </Button>
              <Button
                type={isAutoScroll ? 'default' : 'primary'}
                danger={isAutoScroll}
                icon={<SwapOutlined />}
                onClick={toggleAutoScroll}
              >
                {isAutoScroll ? '停止滚动' : '自动滚动'}
              </Button>
              <Button onClick={handleCopyAll}>
                复制全部
              </Button>
              <Button onClick={handleExportLog}>
                导出日志
              </Button>
            </Space>
          </div>
          <div className="output" ref={outputRef} style={{ height: outputHeight, padding: 0 }}>
            <VList
              listRef={listRef}
              rowCount={filteredLines.length}
              rowHeight={dynamicRowHeight}
              overscanCount={20}
              style={{ height: outputHeight, width: '100%' }}
              rowComponent={({ index, style }) => {
                return (
                  <div
                    style={{ ...style, padding: 10 }}
                    ref={(el) => {
                      if (el) {
                        dynamicRowHeight.observeRowElements([el]);
                      }
                    }}
                  >
                    {renderLine(filteredLines[index])}
                  </div>
                );
              }}
              rowProps={{}}
            />
          </div>
        </Card>
        <Suspense fallback={null}>
          <LazySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </Suspense>
      </div>
    </div>
  );
};

export { JarRunner };
