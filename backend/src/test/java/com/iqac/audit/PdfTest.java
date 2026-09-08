package com.iqac.audit;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import java.io.File;
import java.nio.file.Files;

public class PdfTest {
    public static void main(String[] args) throws Exception {
        byte[] bytes = Files.readAllBytes(new File("C:/Users/balas/.gemini/antigravity/brain/7b5170d2-6b8c-42ef-83d7-391c60e692f0/.user_uploaded/media_1786367723210.pdf").toPath());
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            System.out.println(stripper.getText(doc));
        }
    }
}
