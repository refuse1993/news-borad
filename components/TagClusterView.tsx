'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TagInfo {
  name: string;
  count: number;
}

interface TagClusterViewProps {
  centerTag: string;
  relatedTags: TagInfo[];
  onTagSelect: (tagName: string) => void;
}

export default function TagClusterView({
  centerTag,
  relatedTags,
  onTagSelect
}: TagClusterViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !centerTag) return;

    // 기존 그래프 초기화
    d3.select(svgRef.current).selectAll("*").remove();

    // SVG 크기 설정
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // 관련 태그가 없는 경우
    if (relatedTags.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", "14px")
        .text(`${centerTag}와 연관된 태그가 없습니다.`);
      return;
    }

    // 최대 버블 크기 계산을 위한 최대 카운트 가져오기
    const maxCount = Math.max(...relatedTags.map(tag => tag.count));
    
    // 패킹 레이아웃을 위한 데이터 준비
    const packData = [
      {
        name: centerTag,
        value: maxCount * 1.5, // 중심 태그는 더 크게
        type: 'center'
      },
      ...relatedTags.map(tag => ({
        name: tag.name,
        value: tag.count,
        type: 'related'
      }))
    ];

    // 계층 구조 생성
    const hierarchyData = d3.hierarchy({ children: packData })
      .sum(d => (d as any).value);

    // 패킹 레이아웃 생성
    const packLayout = d3.pack()
      .size([width - 20, height - 20])
      .padding(5);

    // 패킹 레이아웃 적용
    const root = packLayout(hierarchyData);

    // 색상 스케일
    const colorScale = d3.scaleOrdinal()
      .domain(['center', 'related'])
      .range(['#4f46e5', '#60a5fa']);

    // 버블 그룹 생성
    const node = svg.append("g")
      .attr("transform", `translate(10, 10)`)
      .selectAll("g")
      .data(root.descendants().slice(1)) // 루트 노드 제외
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("class", "bubble-node")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const nodeData = d.data as any;
        if (nodeData.name !== centerTag) {
          onTagSelect(nodeData.name);
        }
      });

    // 버블 원 생성
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => colorScale((d.data as any).type))
      .attr("fill-opacity", d => (d.data as any).type === 'center' ? 0.9 : 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // 태그 이름 텍스트 추가
    node.append("text")
      .text(d => (d.data as any).name)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", d => Math.min(d.r / 3, 14))
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .style("user-select", "none");

    // 터치 디바이스 최적화를 위한 마우스 이벤트
    node.on("mouseover", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", function(d: any) {
          return `translate(${d.x},${d.y}) scale(1.05)`;
        });
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", function(d: any) {
          return `translate(${d.x},${d.y}) scale(1)`;
        });
    });

  }, [centerTag, relatedTags, onTagSelect]);

  return (
    <div className="h-full w-full touch-none">
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}