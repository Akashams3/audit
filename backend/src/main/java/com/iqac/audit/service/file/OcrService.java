package com.iqac.audit.service.file;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;

@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    @Value("${ocr.tesseract.datapath:C:/Program Files/Tesseract-OCR/tessdata}")
    private String tesseractDataPath;

    @Value("${ocr.tesseract.language:eng}")
    private String tesseractLanguage;

    @Value("${ocr.api.key:helloworld}")
    private String ocrApiKey;

    @Value("${ocr.api.url:https://api.ocr.space/parse/image}")
    private String ocrApiUrl;

    private static final int OCR_DPI = 300;

    /**
     * Perform OCR on a PDF or image file.
     */
    public String performOcr(MultipartFile file) {
        log.info("Starting OCR processing for file: {}", file.getOriginalFilename());
        try {
            return performOcr(file.getBytes(), file.getOriginalFilename());
        } catch (IOException e) {
            log.error("Failed to read bytes from uploaded file '{}': {}", file.getOriginalFilename(), e.getMessage());
            throw new RuntimeException("Failed to read file for OCR: " + e.getMessage(), e);
        }
    }

    /**
     * Perform OCR on raw file bytes (PDF or image).
     */
    public String performOcr(byte[] fileBytes, String fileName) {
        log.info("Starting OCR for: {}", fileName);

        String result = "";

        // 1. Check if local Tesseract OCR installation exists
        boolean localTesseractAvailable = isLocalTesseractAvailable();

        if (localTesseractAvailable) {
            log.info("Local Tesseract installation found at '{}'. Attempting local OCR...", tesseractDataPath);
            try {
                result = performLocalOcr(fileBytes, fileName);
            } catch (Exception e) {
                log.warn("Local Tesseract OCR failed for '{}': {}. Falling back to OCR API...", fileName, e.getMessage());
            }
        } else {
            log.info("Local Tesseract tessdata not found at '{}'. Falling back to OCR API...", tesseractDataPath);
        }

        // 2. Fallback to OCR API if local OCR returned empty text
        if (result == null || result.isBlank()) {
            log.info("Using OCR API for '{}'...", fileName);
            result = performOcrApi(fileBytes, fileName);
        }

        log.info("Total OCR text extracted for '{}': {} chars", fileName, result != null ? result.length() : 0);
        return result != null ? result.trim() : "";
    }

    private boolean isLocalTesseractAvailable() {
        if (tesseractDataPath == null || tesseractDataPath.isBlank()) {
            return false;
        }
        File dataDir = new File(tesseractDataPath);
        return dataDir.exists() && dataDir.isDirectory();
    }

    private String performLocalOcr(byte[] fileBytes, String fileName) {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tesseractDataPath);
        tesseract.setLanguage(tesseractLanguage);
        tesseract.setPageSegMode(6);
        tesseract.setOcrEngineMode(1);

        StringBuilder fullText = new StringBuilder();
        String lowerName = fileName != null ? fileName.toLowerCase() : "";

        // Try reading as Image if image format
        if (isImageFilename(lowerName)) {
            try (ByteArrayInputStream bais = new ByteArrayInputStream(fileBytes)) {
                BufferedImage image = ImageIO.read(bais);
                if (image != null) {
                    String text = tesseract.doOCR(image);
                    if (text != null && !text.isBlank()) {
                        fullText.append(text);
                    }
                    return fullText.toString().trim();
                }
            } catch (Exception e) {
                log.warn("ImageIO reading failed for '{}': {}", fileName, e.getMessage());
            }
        }

        // Try reading as PDF
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            int pageCount = document.getNumberOfPages();
            for (int page = 0; page < pageCount; page++) {
                try {
                    BufferedImage image = pdfRenderer.renderImageWithDPI(page, OCR_DPI, ImageType.RGB);
                    String pageText = tesseract.doOCR(image);
                    if (pageText != null && !pageText.isBlank()) {
                        fullText.append(pageText).append("\n");
                    }
                } catch (TesseractException e) {
                    log.error("OCR failed for PDF page {}: {}", page + 1, e.getMessage());
                }
            }
            return fullText.toString().trim();
        } catch (IOException pdfEx) {
            // Fallback: Try reading bytes as image if PDF load failed
            try (ByteArrayInputStream bais = new ByteArrayInputStream(fileBytes)) {
                BufferedImage image = ImageIO.read(bais);
                if (image != null) {
                    String text = tesseract.doOCR(image);
                    if (text != null && !text.isBlank()) {
                        fullText.append(text);
                    }
                    return fullText.toString().trim();
                }
            } catch (Exception e) {
                log.error("Image fallback failed for '{}': {}", fileName, e.getMessage());
            }
        }

        return fullText.toString().trim();
    }

    private String performOcrApi(byte[] fileBytes, String fileName) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("apikey", ocrApiKey);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return fileName != null && !fileName.isBlank() ? fileName : "file.png";
                }
            });
            body.add("language", tesseractLanguage != null ? tesseractLanguage : "eng");
            body.add("isOverlayRequired", "false");
            body.add("isTable", "true");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(ocrApiUrl, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.getBody());
                JsonNode parsedResults = root.path("ParsedResults");
                if (parsedResults.isArray() && parsedResults.size() > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (JsonNode page : parsedResults) {
                        String pageText = page.path("ParsedText").asText();
                        if (pageText != null && !pageText.isBlank()) {
                            sb.append(pageText).append("\n");
                        }
                    }
                    String result = sb.toString().trim();
                    log.info("OCR API extracted {} chars from '{}'", result.length(), fileName);
                    return result;
                }
            }
        } catch (Exception e) {
            log.error("OCR API call failed for '{}': {}", fileName, e.getMessage());
        }
        return "";
    }

    private boolean isImageFilename(String fileName) {
        if (fileName == null) return false;
        String lower = fileName.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg")
            || lower.endsWith(".png") || lower.endsWith(".bmp")
            || lower.endsWith(".webp") || lower.endsWith(".tiff");
    }
}

