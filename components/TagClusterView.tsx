// components/TagClusterView.tsx
'use client';

import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { hierarchy, pack, HierarchyNode } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';

interface TagInfo {
  name: string;
  count: number;
}

// 패킹 데이터 인터페이스 정의
interface TagPackData {
  name: string;
  value: number;
  type: 'center' | 'related';
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
    select(svgRef.current).selectAll("*").remove();

    // SVG 크기 설정
    const svg = select(svgRef.current);
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
    const packData: TagPackData[] = [
      {
        name: centerTag,
        value: maxCount * 1.5, // 중심 태그는 더 크게
        type: 'center'
      },
      ...relatedTags.map(tag => ({
        name: tag.name,
        value: tag.count,
        type: 'related' as const
      }))
    ];

    // 계층 구조 생성 (data 객체 타입은 {children: TagPackData[]}이지만 계층 노드 내부 데이터는 TagPackData)
    const hierarchyData = hierarchy<{children: TagPackData[]}>({ children: packData })
      .sum(d => {
        // d의 타입이 TagPackData 또는 계층 노드의 루트인지 확인
        // 'value' 속성이 있으면 해당 값 사용, 없으면 0 반환
        return ('value' in d) ? Number(d.value) : 0;
      });

    // 패킹 레이아웃 생성
    const packLayout = pack<{children: TagPackData[]}>()
      .size([width - 20, height - 20])
      .padding(5);

    // 패킹 레이아웃 적용
    const root = packLayout(hierarchyData);

    // 색상 스케일
    const colorScale = scaleOrdinal<string>()
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
        // 노드 데이터가 루트가 아닌 경우 태그 데이터에 접근
        const nodeData = d.data as unknown as TagPackData;
        if (nodeData.name !== centerTag) {
          onTagSelect(nodeData.name);
        }
      });

    // 버블 원 생성
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => {
        const data = d.data as unknown as TagPackData;
        return colorScale(data.type);
      })
      .attr("fill-opacity", d => {
        const data = d.data as unknown as TagPackData;
        return data.type === 'center' ? 0.9 : 0.7;
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // 태그 이름 텍스트 추가
    node.append("text")
      .text(d => {
        const data = d.data as unknown as TagPackData;
        return data.name;
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", d => Math.min(d.r / 3, 14))
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .style("user-select", "none");

    // 터치 디바이스 최적화를 위한 마우스 이벤트
    node.on("mouseover", function() {
      select(this)
        .transition()
        .duration(200)
        .attr("transform", function(d: any) {
          return `translate(${d.x},${d.y}) scale(1.05)`;
        });
    })
    .on("mouseout", function() {
      select(this)
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