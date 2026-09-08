package com.iqac.audit.service.user;

import com.iqac.audit.entity.user.User;
import com.iqac.audit.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.Optional;

@Service
public class ProfileImageService {

    @Value("${iqac.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private UserRepository userRepository;

    public User uploadProfileImage(Long userId, MultipartFile file) throws IOException {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        User user = userOpt.get();

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String storedFilename = "profile_" + userId + "_" + System.currentTimeMillis() + "_" + originalFilename;

        Path profileFolder = Paths.get(uploadDir, "profiles");
        Files.createDirectories(profileFolder);

        Path targetPath = profileFolder.resolve(storedFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String base64Image = "data:" + file.getContentType() + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());
        user.setProfileImageBase64(base64Image);
        return userRepository.save(user);
    }

    public Path loadProfileImage(String filename) {
        return Paths.get(uploadDir, "profiles", filename);
    }
}
