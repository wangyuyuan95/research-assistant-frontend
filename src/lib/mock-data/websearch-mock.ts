// Mock数据 - 包含web search和knowledge base的混合结果
export const mockWebSearchWithKnowledgeBase = {
  message_id: "59c16d75-e948-469d-ad09-30d3fbe71aaf",
  thread_id: "ed076b63-7c19-40f9-921e-d9421fdcb60c",
  type: "tool",
  is_llm_message: true,
  content: {
    role: "user",
    content: JSON.stringify({
      tool_execution: {
        function_name: "web_search",
        xml_tag_name: "web-search",
        tool_call_id: null,
        arguments: {
          query: "钛基材载银涂层 抗菌机制 制备工艺 生物相容性 2024",
          num_results: 15
        },
        result: {
          success: true,
          output: {
            query: "钛基材载银涂层 抗菌机制 制备工艺 生物相容性 2024",
            follow_up_questions: null,
            answer: "根据搜索结果和知识库内容，钛基材载银涂层通过释放银离子实现抗菌效果...",
            images: [
              "https://www.yongyiti.com/ueditor/php/upload/image/20250412/1744447181247126.png",
              "https://www.kzjsbc.com/ueditor/php/upload/image/20250211/1739288384709578.jpg"
            ],
            results: [
              {
                source: "web_search",
                url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10894730/",
                title: "钛植入物表面抗菌涂层的研究进展- PMC",
                content: "近年来，钛及钛合金等骨植入材料以其卓越的机械性能和良好的生物相容性广泛应用于生物医学领域。然而在临床实践中，细菌在材料表面的黏附以及术后感染问题可能导致植入失败。",
                score: 0.758958,
                raw_content: null
              },
              {
                source: "knowledge_base",
                title: "基于\"三+二\"测序的小鼠早期胚胎转录组构建_袁杰.pdf",
                content: "钛基材料载银涂层的抗菌机制主要通过银离子的缓慢释放实现，银离子能够破坏细菌细胞膜、抑制细菌新陈代谢，并通过静电吸引作用促进细菌与材料接触，诱导离子置换效应达到杀菌目的。",
                score: 0.683561,
                url: null,
                raw_content: null,
                highlight: "钛基材料载银涂层的<em>抗菌机制</em>主要通过银离子的缓慢释放实现，银离子能够破坏<em>细菌细胞膜</em>、抑制细菌新陈代谢",
                important_keywords: ["银离子", "抗菌机制", "细菌细胞膜"],
                dataset_name: "生物医学研究数据库",
                document_id: "9b8a78c4-5d6e-7f8g-9h0i-1j2k3l4m5n6o"
              },
              {
                source: "web_search",
                url: "https://www.cjter.com/CN/10.3969/j.issn.2095-4344.2014.52.005",
                title: "钛基表面纳米银复合涂层体外抗菌活性及生物安全性评价",
                content: "通过体内外生物相容性研究证实钛基表面沉积制备的羟基磷灰石/纳米银复合材料，体外对金黄色葡萄球菌具有良好的抗菌作用，且具有良好的生物相容性。",
                score: 0.73138535,
                raw_content: null
              },
              {
                source: "knowledge_base",
                title: "钛合金生物医用材料表面改性技术研究.pdf",
                content: "制备工艺方面，主要采用微弧氧化、阳极氧化、电泳沉积法、磁控溅射、逐层自组装技术等方法，其中微弧氧化技术能够将银离子均匀掺入钛表面的TiO2纳米管中，实现可控的银离子释放。",
                score: 0.6784214,
                url: null,
                raw_content: null,
                highlight: "<em>制备工艺</em>方面，主要采用微弧氧化、阳极氧化、电泳沉积法、磁控溅射、<em>逐层自组装技术</em>等方法",
                important_keywords: ["制备工艺", "微弧氧化", "阳极氧化"],
                dataset_name: "材料科学知识库",
                document_id: "5a6b7c8d-9e0f-1g2h-3i4j-5k6l7m8n9o0p"
              },
              {
                source: "web_search",
                url: "https://yxxz.whuznhmedj.com/journal/6385.html",
                title: "钛植入物表面抗菌改性的研究进展 - 医学新知",
                content: "另外，钛植入物表面的正电荷还能通过静电吸引作用，促进细菌与材料的接触，诱导离子置换效应，从而达到杀菌效果。",
                score: 0.5694942,
                raw_content: null
              },
              {
                source: "knowledge_base",
                title: "纳米银抗菌材料的生物相容性研究进展.pdf",
                content: "生物相容性评价显示，钛基载银涂层在动物实验中未出现明显的热原反应、溶血反应、急性毒性反应和皮肤刺激反应，与不含银的纯羟基磷灰石材料相比生物相容性差异无显著性意义。",
                score: 0.6421875,
                url: null,
                raw_content: null,
                highlight: "<em>生物相容性</em>评价显示，钛基载银涂层在动物实验中未出现明显的热原反应、溶血反应、<em>急性毒性反应</em>",
                important_keywords: ["生物相容性", "动物实验", "急性毒性"],
                dataset_name: "生物医学研究数据库",
                document_id: "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p"
              }
            ],
            response_time: 16.82
          },
          error: null
        }
      }
    })
  }
};

// 纯web search的老数据格式 - 用于兼容性测试
export const mockWebSearchOnly = {
  message_id: "legacy-web-search-id",
  thread_id: "legacy-thread-id",
  type: "tool",
  is_llm_message: true,
  content: {
    role: "user",
    content: JSON.stringify({
      tool_execution: {
        function_name: "web_search",
        xml_tag_name: "web-search",
        tool_call_id: null,
        arguments: {
          query: "人工智能发展趋势",
          num_results: 10
        },
        result: {
          success: true,
          output: {
            query: "人工智能发展趋势",
            follow_up_questions: null,
            answer: "人工智能正在快速发展，在各个领域都有广泛应用...",
            images: ["https://example.com/ai-image1.jpg"],
            results: [
              {
                url: "https://example.com/ai-trends",
                title: "2024年人工智能发展趋势分析",
                content: "人工智能技术在2024年将继续快速发展，机器学习、深度学习等技术日趋成熟。",
                score: 0.89,
                raw_content: null
              },
              {
                url: "https://example.com/ai-future",
                title: "AI技术的未来前景",
                content: "随着算力的提升和算法的优化，人工智能将在更多场景中发挥重要作用。",
                score: 0.85,
                raw_content: null
              }
            ],
            response_time: 12.45
          },
          error: null
        }
      }
    })
  }
}; 