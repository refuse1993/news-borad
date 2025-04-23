// components/TagRelationshipGraph.tsx
'use client';

import { useEffect, useRef } from 'react';
// D3 개별 모듈 임포트
import { select, BaseType } from 'd3-selection';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  Simulation,
  SimulationNodeDatum,
  ForceLink,
} from 'd3-force';
import { drag } from 'd3-drag';
import { scaleOrdinal } from 'd3-scale'; // 필요 시 사용 (현재 코드에서는 직접 사용 안 함)

// 데이터 인터페이스 정의
interface TagRelation {
  source: string | SimulationNode; // 관계의 시작 태그 ID
  target: string | SimulationNode; // 관계의 대상 태그 ID
  strength: number; // 관계 강도 (0 ~ 1)
}

interface TagNode {
  id: string; // 태그 이름 (고유 ID)
  group: number; // 그룹 (1: 선택된 중심 태그, 2: 관련 태그)
  // count?: number; // 필요 시 태그 빈도수 등 추가 정보
}

// D3 시뮬레이션에서 사용할 노드 타입 확장
interface SimulationNode extends TagNode, SimulationNodeDatum {
  // SimulationNodeDatum은 x, y, vx, vy, fx, fy 등의 속성을 추가합니다.
}

interface TagRelationshipGraphProps {
  selectedTag: string; // 현재 선택된 중심 태그
  relations: TagRelation[]; // 태그 관계 데이터 배열
  onTagSelect: (tagName: string) => void; // 다른 태그 클릭 시 호출될 함수
}

export default function TagRelationshipGraph({
  selectedTag,
  relations,
  onTagSelect
}: TagRelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<Simulation<SimulationNode, TagRelation> | null>(null); // 시뮬레이션 참조 추가

  useEffect(() => {
    // SVG 요소가 준비되지 않았거나, relations 데이터가 아직 로드되지 않았으면 아무것도 하지 않음
    // relations가 빈 배열일 경우에도 그래프를 그리지 않고 useEffect를 종료합니다.
    // 데이터가 로드되면 이 useEffect가 다시 실행됩니다.
    if (!svgRef.current || !relations || relations.length === 0) {
        // 기존 그래프가 있다면 정리 (데이터가 사라진 경우 등)
        if (svgRef.current) {
            select(svgRef.current).selectAll("*").remove();
        }
        // 시뮬레이션 중지 (이전에 실행 중이었다면)
        simulationRef.current?.stop();
        simulationRef.current = null;
        return;
    }

    // SVG 요소 및 크기 가져오기
    const svgElement = svgRef.current;
    const svg = select(svgElement);
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

    // 기존 그래프 요소 제거 (재렌더링 시)
    svg.selectAll("*").remove();

    // --- 데이터 처리 ---
    // 노드 맵 생성 (중복 방지 및 빠른 탐색)
    const nodeMap = new Map<string, SimulationNode>();

    // 링크 데이터 생성 (입력된 relations 그대로 사용 가능)
    // D3의 forceLink는 source/target 문자열 ID를 기반으로 노드를 연결합니다.
    const links: TagRelation[] = relations.map(relation => {
      // 문자열 상태로 유지하고 시뮬레이션 내부에서 변환되도록 함
      return {
        source: relation.source,
        target: relation.target,
        strength: relation.strength
      };
    });

    // 관계 데이터(links)를 순회하며 모든 노드 정보를 nodeMap에 추가
    links.forEach(rel => {
      // 소스 노드 추가 또는 업데이트
      const sourceId = typeof rel.source === 'string' ? rel.source : rel.source.id;
      if (!nodeMap.has(sourceId)) {
        nodeMap.set(sourceId, {
          id: sourceId,
          group: sourceId === selectedTag ? 1 : 2, // 중심 태그는 group 1
          // 필요한 경우 여기에 추가 속성 (예: count) 초기화
        });
      }
      // 타겟 노드 추가 또는 업데이트
      const targetId = typeof rel.target === 'string' ? rel.target : rel.target.id;
      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, {
          id: targetId,
          group: targetId === selectedTag ? 1 : 2, // 중심 태그는 group 1
        });
      }
    });

    // 중심 태그가 relations에 포함되지 않았을 경우에도 추가 보장
    if (!nodeMap.has(selectedTag)) {
        nodeMap.set(selectedTag, { id: selectedTag, group: 1 });
    }

    // 노드 배열 생성 (Map의 값들을 배열로 변환)
    const nodes: SimulationNode[] = Array.from(nodeMap.values());

    // --- D3 시뮬레이션 설정 ---

    // 링크 거리 함수: 연관 강도에 반비례 (강할수록 가깝게)
    const linkDistance = (d: TagRelation): number => {
      // 기본 거리 + 강도에 따른 추가 거리 (강도가 1이면 최소 거리, 0이면 최대 거리)
      const baseDistance = 50;
      const variableDistance = 150; // 거리 범위 조절
      return baseDistance + variableDistance * (1 - d.strength);
    };

    // 링크 강도 함수: 데이터의 strength를 직접 사용하거나 조절
    const linkStrength = (d: TagRelation): number => {
      // 강도를 0.1 ~ 0.8 범위 정도로 조절하여 너무 강하거나 약하지 않게
      return d.strength * 0.7 + 0.1;
    };

    // 시뮬레이션 생성 및 설정
    // 이전 시뮬레이션 중지
    simulationRef.current?.stop();

    // 새 시뮬레이션 생성
    const simulation = forceSimulation<SimulationNode, TagRelation>(nodes)
      .force("link", forceLink<SimulationNode, TagRelation>(links)
        .id((d: SimulationNode | string) => {
          // d가 문자열이면 그대로 반환, 객체면 id 속성 반환
          return typeof d === 'string' ? d : d.id;
        })
        .distance(linkDistance) // 링크 거리 설정
        .strength(linkStrength) // 링크 강도 설정
      )
      .force("charge", forceManyBody<SimulationNode>()
        // 중심 노드는 더 강한 척력, 다른 노드들은 약간 약한 척력
        .strength(d => d.group === 1 ? -400 : -200)
        .distanceMin(20) // 최소 거리 유지
        .distanceMax(300) // 최대 영향 거리
      )
      .force("center", forceCenter(width / 2, height / 2).strength(0.1)) // 그래프를 중앙으로 부드럽게 당김
      .force("collision", forceCollide<SimulationNode>()
         // 노드 크기를 고려한 충돌 반경 설정 (아래 원 크기 계산과 연동)
        .radius(d => (d.group === 1 ? 25 : 15) + 5) // 노드 반경 + 약간의 여유 공간
        .strength(0.8) // 충돌 방지 강도
      );

    // 시뮬레이션 참조 저장
    simulationRef.current = simulation;


    // --- SVG 요소 그리기 ---

    // 링크 (선) 그룹
    const link = svg.append("g")
      .attr("class", "links")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.max(1, d.strength * 5)); // 강도에 따라 선 굵기 조절

    // 노드 (원 + 텍스트) 그룹
    const nodeGroup = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g.node") // 각 노드를 그룹으로 묶음
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", d => d.id === selectedTag ? "default" : "pointer") // 중심 태그 외에는 포인터 커서
      .on("click", (event: MouseEvent, d: SimulationNode) => {
        // 중심 태그가 아닌 노드를 클릭했을 때 onTagSelect 호출
        if (d.id !== selectedTag) {
          onTagSelect(d.id);
        }
      })
      .call(dragHandler(simulation) as any); // 드래그 기능 적용


    // 노드 원 (Circle)
    nodeGroup.append("circle")
      .attr("r", (d: SimulationNode) => d.group === 1 ? 25 : 15) // 중심 노드 크게
      .attr("fill", (d: SimulationNode) => d.group === 1 ? "#4f46e5" : "#60a5fa") // 그룹별 색상
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // 노드 텍스트 (태그 이름)
    nodeGroup.append("text")
      .text((d: SimulationNode) => d.id)
      .attr("x", 0) // 그룹의 중앙 기준
      .attr("y", (d: SimulationNode) => d.group === 1 ? 35 : 25) // 원 아래 위치 조정
      .attr("text-anchor", "middle") // 중앙 정렬
      .attr("font-size", (d: SimulationNode) => d.group === 1 ? "12px" : "10px")
      .attr("fill", "#374151") // 텍스트 색상 (기존 색상보다 약간 어둡게)
      .attr("font-weight", (d: SimulationNode) => d.group === 1 ? "600" : "400")
      .style("pointer-events", "none"); // 텍스트는 클릭/드래그 이벤트 방해 않도록

    // 연관 강도 텍스트 (원 안, 중심 노드 제외)
    nodeGroup.filter((d: SimulationNode) => d.group !== 1) // 중심 노드 제외
      .append("text")
      .text((d: SimulationNode) => {
        // 이 노드를 target으로 하는 관계 찾기 (주로 중심->관련 태그 관계)
        // 만약 관련 태그 간 관계도 표시하고 싶다면, 로직 수정 필요
        const relationToCenter = relations.find(r => {
          const sourceId = typeof r.source === 'string' ? r.source : r.source.id;
          const targetId = typeof r.target === 'string' ? r.target : r.target.id;
          return sourceId === selectedTag && targetId === d.id;
        });
        return relationToCenter ? `${Math.round(relationToCenter.strength * 100)}%` : "";
      })
      .attr("x", 0)
      .attr("y", 0) // 원 중앙
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#fff") // 흰색 텍스트
      .attr("dominant-baseline", "central") // 세로 중앙 정렬
      .style("pointer-events", "none");


    // --- 시뮬레이션 업데이트 ---
    simulation.on("tick", () => {
      // 링크 위치 업데이트
      link
        .attr("x1", d => {
          // source가 string이 아닌 객체일 경우 x 속성에 접근, 아니면 0 반환
          return typeof d.source === 'object' && d.source !== null ? (d.source as SimulationNode).x ?? 0 : 0;
        })
        .attr("y1", d => {
          return typeof d.source === 'object' && d.source !== null ? (d.source as SimulationNode).y ?? 0 : 0;
        })
        .attr("x2", d => {
          return typeof d.target === 'object' && d.target !== null ? (d.target as SimulationNode).x ?? 0 : 0;
        })
        .attr("y2", d => {
          return typeof d.target === 'object' && d.target !== null ? (d.target as SimulationNode).y ?? 0 : 0;
        });

      // 노드 그룹 위치 업데이트 (SVG 경계 제한 포함)
      nodeGroup.attr("transform", (d: SimulationNode) => {
          // 노드가 SVG 영역을 벗어나지 않도록 좌표 제한
          const radius = d.group === 1 ? 25 : 15;
          const textOffset = d.group === 1 ? 35 : 25; // 텍스트 위치 고려
          d.x = Math.max(radius, Math.min(width - radius, d.x ?? 0));
          d.y = Math.max(radius, Math.min(height - textOffset, d.y ?? 0)); // 텍스트 높이 고려
          return `translate(${d.x},${d.y})`;
        });
    });

    // --- 상호작용 ---
    nodeGroup
      .on("mouseover", function(event: MouseEvent, d: SimulationNode) {
        if (d.id !== selectedTag) { // 중심 태그는 제외
            select(this).select("circle")
              .transition().duration(150)
              .attr("stroke", "#fbbf24") // 강조 색상 (노란색 계열)
              .attr("stroke-width", 3);
        }
      })
      .on("mouseout", function(event: MouseEvent, d: SimulationNode) {
         if (d.id !== selectedTag) {
            select(this).select("circle")
              .transition().duration(150)
              .attr("stroke", "#fff") // 원래 테두리 색
              .attr("stroke-width", 1.5); // 원래 테두리 굵기
         }
      });

    // 드래그 핸들러 함수
    function dragHandler(simulation: Simulation<SimulationNode, TagRelation>) {
      function dragstarted(event: any, d: SimulationNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart(); // 시뮬레이션 활성화
        d.fx = d.x; // 현재 위치를 고정 위치(fx, fy)로 설정
        d.fy = d.y;
      }

      function dragged(event: any, d: SimulationNode) {
        d.fx = event.x; // 드래그하는 동안 고정 위치 업데이트
        d.fy = event.y;
      }

      function dragended(event: any, d: SimulationNode) {
        if (!event.active) simulation.alphaTarget(0); // 시뮬레이션 안정화

        // 중심 태그는 드래그 끝나면 고정 해제 (다시 중앙으로 가도록)
        // 다른 태그는 고정 해제 (시뮬레이션에 의해 위치 재조정)
        // 만약 드래그 후 위치를 유지하고 싶다면 아래 주석 처리
        d.fx = null;
        d.fy = null;

        // 중심 태그를 항상 중앙에 고정시키고 싶다면 아래 코드 사용
        // if (d.id === selectedTag) {
        //   d.fx = width / 2;
        //   d.fy = height / 2;
        // } else {
        //   d.fx = null;
        //   d.fy = null;
        // }
      }

      return drag<any, SimulationNode>() // Use 'any' for element type if BaseType doesn't work directly
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // 초기 위치 고정 (선택 사항: 시뮬레이션이 안정화되도록 둘 수도 있음)
    // 중심 노드만 초기에 중앙에 고정
    nodes.forEach(node => {
      if (node.id === selectedTag) {
        node.fx = width / 2;
        node.fy = height / 2;
      }
    });

    // 컴포넌트 언마운트 시 시뮬레이션 정리
    return () => {
      simulationRef.current?.stop(); // 참조된 시뮬레이션 중지
      simulationRef.current = null;
    };

    // 의존성 배열: selectedTag나 relations 데이터가 변경되면 useEffect 재실행
  }, [selectedTag, relations, onTagSelect]);

  // 데이터 로딩 중 또는 데이터가 없을 때 표시할 내용
  // useEffect 내부의 조건문에서 빈 배열 케이스를 처리하므로, 여기서는 로딩 상태 등을 표시할 수 있음
  // (현재 코드는 데이터 없으면 useEffect 초반에 return하므로, 이 부분은 relations가 초기 null/undefined일 때만 보일 수 있음)
  if (!relations || relations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <p className="text-gray-500 text-sm">
          {selectedTag ? `'${selectedTag}' 태그와 연관된 데이터가 없거나 로딩 중입니다.` : '태그를 선택해주세요.'}
        </p>
      </div>
    );
  }

  // SVG 컨테이너 렌더링
  return (
    <div className="h-full w-full overflow-hidden touch-none">
      {/* SVG 요소 크기를 100%로 설정하고 viewBox 사용 */}
      <svg ref={svgRef} width="100%" height="100%" />
      {/* preserveAspectRatio 제거 또는 필요에 맞게 설정 */}
    </div>
  );
}