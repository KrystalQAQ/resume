"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer as ReactPDFViewer,
  PDFDownloadLink as ReactPDFDownloadLink,
  Image,
  Font,
  Svg,
  Path,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";

// 注册字体
Font.register({
  family: "NotoSansSC",
  src: "/NotoSansSC-Medium.ttf",
  fontStyle: "normal",
  fontWeight: "normal",
});

// 注册中文字符断字回调，使每个中文字符可以单独换行
Font.registerHyphenationCallback((word) => {
  if (word.length === 1) {
    return [word];
  }

  return Array.from(word)
    .map((char) => [char, ""])
    .reduce((arr, current) => {
      arr.push(...current);
      return arr;
    }, []);
});

// 由于我们只有一个字体文件，我们需要将其注册为所有样式
// 这样可以防止 React PDF 尝试查找不存在的字体变体
Font.register({
  family: "NotoSansSC",
  src: "/NotoSansSC-Medium.ttf",
  fontStyle: "italic",
  fontWeight: "normal",
});

Font.register({
  family: "NotoSansSC",
  src: "/NotoSansSC-Medium.ttf",
  fontStyle: "normal",
  fontWeight: "bold",
});

Font.register({
  family: "NotoSansSC",
  src: "/NotoSansSC-Medium.ttf",
  fontStyle: "italic",
  fontWeight: "bold",
});

// 创建样式
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "NotoSansSC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  personalInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  personalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 5,
  },
  personalInfoInline: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  personalInfoInlineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 3,
  },
  personalInfoSeparator: {
    marginRight: 8,
    color: "#999",
  },
  label: {
    fontSize: 10,
    color: "#666",
    marginRight: 5,
  },
  value: {
    fontSize: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 15,
  },
  moduleContainer: {
    marginBottom: 15,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    // 下边框相关样式移除
  },
  moduleTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    marginBottom: 8,
    width: "100%",
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "medium",
  },
  timeRange: {
    fontSize: 10,
    color: "#666",
    // 避免使用斜体，因为我们的字体可能不支持真正的斜体渲染
    // fontStyle: "italic",
  },
  content: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  placeholder: {
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },
});

type IconType = {
  icon?: string;
  size?: number;
  style?: React.CSSProperties;
};

// 提取path路径 d 属性 并返回svg
const renderIcon = ({ icon, size, style }: IconType) => {
  if (!icon) return null;
  const match = icon.match(/d="([^"]+)"/);
  if (match && match[1]) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style as any}>
        <Path d={match[1]} fill="black" />
      </Svg>
    );
  }
  return null;
};

// 渲染个人信息项
const renderPersonalInfoItem = (item: any, showLabels: boolean, isInline: boolean) => {
  return (
    <View key={item.id} style={{ flexDirection: "row", alignItems: "center" }}>
      {renderIcon({
        icon: item.icon,
        size: 12,
        style: { marginRight: 5, marginTop: 1 },
      })}
      {showLabels && <Text style={styles.label}>{item.label}:</Text>}
      {item.value.type === "link" && item.value.content ? (
        <Text style={styles.value}>{item.value.title || "点击访问"}</Text>
      ) : (
        <Text style={styles.value}>{item.value.content || "未填写"}</Text>
      )}
    </View>
  );
};

// 将富文本JSON内容渲染为带样式的React-PDF组件
const renderRichText = (content: any): React.ReactNode => {
  if (!content) return null;

  const renderNode = (node: any, index: number): React.ReactNode => {
    // 处理文本节点
    if (node.text !== undefined) {
      // 收集所有样式
      const textStyles: any = {
        fontSize: 10,
      };

      // 处理marks（粗体、斜体、下划线、颜色等）
      if (node.marks && Array.isArray(node.marks)) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              textStyles.fontWeight = 'bold';
              break;
            case 'italic':
              textStyles.fontStyle = 'italic';
              break;
            case 'underline':
              textStyles.textDecoration = 'underline';
              break;
            case 'strike':
              textStyles.textDecoration = 'line-through';
              break;
            case 'textStyle':
              // 处理颜色
              if (mark.attrs?.color) {
                textStyles.color = mark.attrs.color;
              }
              // 处理字号
              if (mark.attrs?.fontSize) {
                const fontSize = mark.attrs.fontSize;
                // 提取数字部分
                const match = fontSize.match(/(\d+)/);
                if (match) {
                  textStyles.fontSize = parseInt(match[1], 10);
                }
              }
              break;
          }
        });
      }

      return (
        <Text key={index} style={textStyles}>
          {node.text}
        </Text>
      );
    }

    // 处理段落节点
    if (node.type === 'paragraph') {
      const paragraphStyles: any = {
        marginBottom: 3,
      };

      // 处理文本对齐
      if (node.attrs?.textAlign) {
        paragraphStyles.textAlign = node.attrs.textAlign;
      }

      return (
        <View key={index} style={paragraphStyles}>
          {node.content && Array.isArray(node.content) ? (
            <Text style={styles.content}>
              {node.content.map((child: any, childIndex: number) =>
                renderNode(child, childIndex)
              )}
            </Text>
          ) : (
            <Text style={styles.content}> </Text>
          )}
        </View>
      );
    }

    // 处理文档节点
    if (node.type === 'doc' && node.content && Array.isArray(node.content)) {
      return (
        <View key={index}>
          {node.content.map((child: any, childIndex: number) =>
            renderNode(child, childIndex)
          )}
        </View>
      );
    }

    // 处理其他节点类型
    if (node.content && Array.isArray(node.content)) {
      return node.content.map((child: any, childIndex: number) =>
        renderNode(child, childIndex)
      );
    }

    return null;
  };

  return renderNode(content, 0);
};

// 简历PDF文档组件
const ResumePDF = ({ resumeData }: { resumeData: ResumeData }) => {
  // 向后兼容：支持personalInfoInline和新的layout配置
  const personalInfoSection = resumeData.personalInfoSection;
  const isInline = personalInfoSection?.layout?.mode === 'inline' ||
    (personalInfoSection?.layout?.mode === undefined && (personalInfoSection as any)?.personalInfoInline);
  const itemsPerRow = personalInfoSection?.layout?.itemsPerRow || 2;
  const showLabels = personalInfoSection?.showPersonalInfoLabels !== false;
  const personalInfoItems = personalInfoSection?.personalInfo || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 头部信息 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{resumeData.title || "简历标题"}</Text>

            {/* 个人信息 */}
            {isInline ? (
              // 单行显示模式
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                {personalInfoItems.map((item, index) => (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center" }}>
                    {renderPersonalInfoItem(item, showLabels, true)}
                    {index < personalInfoItems.length - 1 && (
                      <Text style={styles.personalInfoSeparator}> • </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              // 多行显示模式 - 使用动态itemsPerRow
              <View style={{ flexDirection: "row", flexWrap: "wrap", width: "100%" }}>
                {personalInfoItems.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      width: `${100 / itemsPerRow}%`,
                      marginBottom: 5,
                      paddingRight: 10
                    }}
                  >
                    {renderPersonalInfoItem(item, showLabels, false)}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 头像 */}
          {resumeData.avatar && (
            <Image src={resumeData.avatar} style={styles.avatar} />
          )}
        </View>

        {/* 简历模块 */}
        {resumeData.modules
          .sort((a, b) => a.order - b.order)
          .map((module) => (
            <View key={module.id} style={styles.moduleContainer}>
              <View style={styles.moduleTitleContainer}>
                {renderIcon({ icon: module.icon, size: 16 })}
                <Text style={styles.moduleTitle}>{module.title}</Text>
              </View>

              <View>
                {/* 渲染行 */}
                {module.rows
                  .sort((a, b) => a.order - b.order)
                  .map((row) => (
                    <View
                      key={row.id}
                      style={{
                        flexDirection: "row",
                        marginBottom: 5,
                        gap: 10
                      }}
                    >
                      {row.elements.map((element) => (
                        <View
                          key={element.id}
                          style={{
                            flex: 1,
                            minWidth: 0
                          }}
                        >
                          {renderRichText(element.content)}
                        </View>
                      ))}
                    </View>
                  ))}
              </View>
            </View>
          ))}

        {/* 空状态提示 */}
        {resumeData.modules.length === 0 && (
          <Text style={styles.placeholder}>暂无简历内容</Text>
        )}
      </Page>
    </Document>
  );
};

// PDF预览组件
export const PDFViewer = ({ resumeData }: { resumeData: ResumeData }) => (
  <ReactPDFViewer width="100%" height="100%" style={{ border: "none" }}>
    <ResumePDF resumeData={resumeData} />
  </ReactPDFViewer>
);

// PDF下载链接组件
export const PDFDownloadLink = ({
  resumeData,
  fileName = "resume.pdf",
  children,
}: {
  resumeData: ResumeData;
  fileName?: string;
  children: React.ReactNode;
}) => (
  <ReactPDFDownloadLink
    document={<ResumePDF resumeData={resumeData} />}
    fileName={fileName}
  >
    {({ loading }) => (loading ? "正在生成PDF..." : children)}
  </ReactPDFDownloadLink>
);

export default ResumePDF;