import {
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
  tableWidth as defaultTableWidth,
} from "../data/constants";
import { getCommentHeight, getTableHeight } from "./utils";

function getComputedStyleValue(element, property) {
  const computed = window.getComputedStyle(element);
  return computed.getPropertyValue(property);
}

function getTextColor(element) {
  const color = getComputedStyleValue(element, "color");
  if (color) return color;
  const textColor = getComputedStyleValue(element, "--semi-color-text-0");
  if (textColor) return textColor;
  return "#000000";
}

function getFontSize(element) {
  const fontSize = getComputedStyleValue(element, "font-size");
  if (fontSize) return fontSize;
  return "14px";
}

function getFontWeight(element) {
  const fontWeight = getComputedStyleValue(element, "font-weight");
  if (fontWeight) return fontWeight;
  return "normal";
}

function getFontFamily(element) {
  const fontFamily = getComputedStyleValue(element, "font-family");
  if (fontFamily) return fontFamily;
  return "system-ui, -apple-system, sans-serif";
}

function extractTextFromElement(element) {
  if (!element) return "";
  if (element.nodeType === Node.TEXT_NODE) {
    return element.textContent || "";
  }
  if (element.nodeType === Node.ELEMENT_NODE) {
    if (element.tagName === "BUTTON" || element.tagName === "I") {
      return "";
    }
    let text = "";
    for (const child of element.childNodes) {
      text += extractTextFromElement(child);
    }
    return text;
  }
  return "";
}

function convertForeignObjectToSvg(foreignObject, settings, tables, notes, areas) {
  const x = parseFloat(foreignObject.getAttribute("x") || 0);
  const y = parseFloat(foreignObject.getAttribute("y") || 0);
  const width = parseFloat(foreignObject.getAttribute("width") || 0);
  const height = parseFloat(foreignObject.getAttribute("height") || 0);

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const htmlContent = foreignObject.querySelector("div");

  if (!htmlContent) return group;

  const hasTableStructure = htmlContent.querySelector("div > div") !== null &&
                            htmlContent.querySelector(".border-b") !== null;
  const isTable = htmlContent.classList.contains("border-2") && hasTableStructure;
  const isNote = htmlContent.classList.contains("text-gray-900") && 
                 htmlContent.querySelector("textarea") !== null;
  const isArea = (htmlContent.style.backgroundColor?.includes("66") || 
                 htmlContent.classList.contains("border-slate-400")) &&
                 !isTable && !isNote;

  if (isTable) {
    return convertTableToSvg(foreignObject, htmlContent, x, y, width, height, settings, tables);
  } else if (isNote) {
    return convertNoteToSvg(foreignObject, htmlContent, x, y, width, height, notes);
  } else if (isArea) {
    return convertAreaToSvg(foreignObject, htmlContent, x, y, width, height, areas);
  }

  return group;
}

function convertTableToSvg(foreignObject, htmlContent, x, y, width, height, settings, tables) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const tableNameElement = htmlContent.querySelector(".px-3");
  const tableName = tableNameElement?.textContent?.trim() || "";
  
  const table = tables?.find((t) => {
    const tableX = Math.round(t.x);
    const tableY = Math.round(t.y);
    const foreignX = Math.round(x);
    const foreignY = Math.round(y);
    return (tableX === foreignX && tableY === foreignY) || t.name === tableName;
  });
  
  if (!table) return group;

  const tableWidth = settings?.tableWidth || defaultTableWidth;
  const showComments = settings?.showComments !== false;
  const showDataTypes = settings?.showDataTypes !== false;
  const mode = settings?.mode || "light";
  const bgColor = mode === "light" ? "#f4f4f5" : "#27272a";
  const textColor = mode === "light" ? "#18181b" : "#e4e4e7";
  const borderColor = mode === "light" ? "#d4d4d8" : "#52525b";
  const headerBgColor = mode === "light" ? "#e4e4e7" : "#18181b";

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("rx", "8");
  rect.setAttribute("fill", bgColor);
  rect.setAttribute("stroke", borderColor);
  rect.setAttribute("stroke-width", "2");
  group.appendChild(rect);

  const colorStrip = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  colorStrip.setAttribute("x", x);
  colorStrip.setAttribute("y", y);
  colorStrip.setAttribute("width", width);
  colorStrip.setAttribute("height", "10");
  colorStrip.setAttribute("rx", "8");
  colorStrip.setAttribute("ry", "8");
  colorStrip.setAttribute("fill", table.color || "#175e7a");
  group.appendChild(colorStrip);

  const headerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  headerRect.setAttribute("x", x);
  headerRect.setAttribute("y", y + 10);
  headerRect.setAttribute("width", width);
  headerRect.setAttribute("height", "40");
  headerRect.setAttribute("fill", headerBgColor);
  group.appendChild(headerRect);

  const headerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  headerLine.setAttribute("x1", x);
  headerLine.setAttribute("y1", y + tableHeaderHeight);
  headerLine.setAttribute("x2", x + width);
  headerLine.setAttribute("y2", y + tableHeaderHeight);
  headerLine.setAttribute("stroke", borderColor);
  headerLine.setAttribute("stroke-width", "1");
  group.appendChild(headerLine);

  const tableNameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tableNameText.setAttribute("x", x + 12);
  tableNameText.setAttribute("y", y + 10 + 28);
  tableNameText.setAttribute("fill", textColor);
  tableNameText.setAttribute("font-size", "14px");
  tableNameText.setAttribute("font-weight", "bold");
  tableNameText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
  tableNameText.textContent = table.name || "";
  group.appendChild(tableNameText);

  let currentY = y + tableHeaderHeight;
  const commentHeight = getCommentHeight(
    table.comment,
    tableWidth,
    showComments
  );

  if (table.comment && showComments && commentHeight > 0) {
    const commentText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    commentText.setAttribute("x", x + 12);
    commentText.setAttribute("y", currentY + 20);
    commentText.setAttribute("fill", textColor);
    commentText.setAttribute("font-size", "12px");
    commentText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    const lines = (table.comment || "").split("\n").slice(0, 5);
    lines.forEach((line, i) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", x + 12);
      tspan.setAttribute("dy", i === 0 ? "0" : "16");
      tspan.textContent = line;
      commentText.appendChild(tspan);
    });
    group.appendChild(commentText);
    currentY += commentHeight;
  }

  table.fields.forEach((field, index) => {
    if (index > 0) {
      const fieldLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      fieldLine.setAttribute("x1", x);
      fieldLine.setAttribute("y1", currentY);
      fieldLine.setAttribute("x2", x + width);
      fieldLine.setAttribute("y2", currentY);
      fieldLine.setAttribute("stroke", borderColor);
      fieldLine.setAttribute("stroke-width", "1");
      group.appendChild(fieldLine);
    }

    const fieldY = currentY + tableFieldHeight / 2 + 5;

    const fieldNameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    fieldNameText.setAttribute("x", x + 12);
    fieldNameText.setAttribute("y", fieldY);
    fieldNameText.setAttribute("fill", textColor);
    fieldNameText.setAttribute("font-size", "14px");
    fieldNameText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    fieldNameText.textContent = field.name || "";
    group.appendChild(fieldNameText);

    if (showDataTypes) {
      const typeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      typeText.setAttribute("x", x + width - 12);
      typeText.setAttribute("y", fieldY);
      typeText.setAttribute("fill", "#a1a1aa");
      typeText.setAttribute("font-size", "14px");
      typeText.setAttribute("font-family", "monospace");
      typeText.setAttribute("text-anchor", "end");
      let typeStr = field.type || "";
      if (field.size && field.size !== "") {
        typeStr += `(${field.size})`;
      }
      if (!field.notNull) {
        typeStr = "?" + typeStr;
      }
      typeText.textContent = typeStr;
      group.appendChild(typeText);

      if (field.primary) {
        const keyIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
        keyIcon.setAttribute("x", x + width - 80);
        keyIcon.setAttribute("y", fieldY);
        keyIcon.setAttribute("fill", textColor);
        keyIcon.setAttribute("font-size", "14px");
        keyIcon.textContent = "🔑";
        group.appendChild(keyIcon);
      }
    }

    currentY += tableFieldHeight;
  });

  return group;
}

function convertNoteToSvg(foreignObject, htmlContent, x, y, width, height, notes) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const textarea = htmlContent.querySelector("textarea");
  const noteId = textarea?.getAttribute("id")?.replace("note_", "");
  
  let note = null;
  if (noteId) {
    note = notes?.find((n) => n.id === noteId);
  }
  
  if (!note) {
    const titleElement = htmlContent.querySelector("label");
    const title = titleElement?.textContent?.trim() || "";
    note = notes?.find((n) => {
      const noteX = Math.round(n.x);
      const noteY = Math.round(n.y);
      const foreignX = Math.round(x);
      const foreignY = Math.round(y);
      return (noteX === foreignX && noteY === foreignY) || n.title === title;
    });
  }
  
  if (!note) return group;

  const titleElement = htmlContent.querySelector("label");
  const contentElement = htmlContent.querySelector("textarea");

  const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  titleText.setAttribute("x", x + 20);
  titleText.setAttribute("y", y + 20);
  titleText.setAttribute("fill", "#111827");
  titleText.setAttribute("font-size", "14px");
  titleText.setAttribute("font-weight", "500");
  titleText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
  titleText.textContent = note.title || "";
  group.appendChild(titleText);

  if (contentElement && note.content) {
    const contentText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    contentText.setAttribute("x", x + 12);
    contentText.setAttribute("y", y + 40);
    contentText.setAttribute("fill", "#111827");
    contentText.setAttribute("font-size", "14px");
    contentText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    const lines = (note.content || "").split("\n");
    lines.forEach((line, i) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", x + 12);
      tspan.setAttribute("dy", i === 0 ? "0" : "18");
      tspan.textContent = line;
      contentText.appendChild(tspan);
    });
    group.appendChild(contentText);
  }

  return group;
}

function convertAreaToSvg(foreignObject, htmlContent, x, y, width, height, areas) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const nameElement = htmlContent.querySelector(".text-color");
  const areaName = nameElement?.textContent?.trim() || "";
  
  const area = areas?.find((a) => {
    const areaX = Math.round(a.x);
    const areaY = Math.round(a.y);
    const foreignX = Math.round(x);
    const foreignY = Math.round(y);
    return (areaX === foreignX && areaY === foreignY) || a.name === areaName;
  });
  
  if (!area) return group;

  const nameElement = htmlContent.querySelector(".text-color");

  const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  nameText.setAttribute("x", x + 8);
  nameText.setAttribute("y", y + 20);
  nameText.setAttribute("fill", "#111827");
  nameText.setAttribute("font-size", "14px");
  nameText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
  nameText.textContent = area.name || "";
  group.appendChild(nameText);

  return group;
}

export function exportToSvg(canvasElement, settings, tables, notes, areas) {
  try {
    const svgElement = canvasElement.querySelector("#diagram");
    if (!svgElement) {
      return Promise.reject(new Error("SVG element not found"));
    }

    const clonedSvg = svgElement.cloneNode(true);
    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      clonedSvg.setAttribute("viewBox", viewBox);
    }

    if (!clonedSvg.getAttribute("xmlns")) {
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    const width = canvasElement.offsetWidth || 800;
    const height = canvasElement.offsetHeight || 600;
    clonedSvg.setAttribute("width", width);
    clonedSvg.setAttribute("height", height);

    const foreignObjects = Array.from(clonedSvg.querySelectorAll("foreignObject"));
    foreignObjects.forEach((foreignObject) => {
      try {
        const replacement = convertForeignObjectToSvg(
          foreignObject,
          settings || {},
          tables || [],
          notes || [],
          areas || []
        );
        if (replacement && replacement.childNodes.length > 0) {
          foreignObject.parentNode.replaceChild(replacement, foreignObject);
        } else {
          foreignObject.remove();
        }
      } catch (error) {
        console.warn("Failed to convert foreignObject:", error);
        foreignObject.remove();
      }
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    return Promise.resolve(svgDataUrl);
  } catch (error) {
    return Promise.reject(error);
  }
}
