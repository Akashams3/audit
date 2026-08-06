package com.iqac.audit.entity.user;

import com.iqac.audit.entity.department.Department;


import jakarta.persistence.*;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "faculty")
public class Faculty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private String name;

    @Column(name = "faculty_code", unique = true, nullable = false)
    private String facultyCode;

    @Column(name = "designations")
    private String designations;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "faculty_assigned_roles",
        joinColumns = @JoinColumn(name = "faculty_id"),
        inverseJoinColumns = @JoinColumn(name = "faculty_role_id")
    )
    private Set<FacultyRole> facultyRoles = new HashSet<>();

    public Faculty() {}

    public Faculty(Long id, User user, Department department, String name, String facultyCode, String designations, Set<FacultyRole> facultyRoles) {
        this.id = id;
        this.user = user;
        this.department = department;
        this.name = name;
        this.facultyCode = facultyCode;
        this.designations = designations;
        this.facultyRoles = facultyRoles != null ? facultyRoles : new HashSet<>();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFacultyCode() {
        return facultyCode;
    }

    public void setFacultyCode(String facultyCode) {
        this.facultyCode = facultyCode;
    }

    public String getDesignations() {
        return designations;
    }

    public void setDesignations(String designations) {
        this.designations = designations;
    }

    public Set<FacultyRole> getFacultyRoles() {
        return facultyRoles;
    }

    public void setFacultyRoles(Set<FacultyRole> facultyRoles) {
        this.facultyRoles = facultyRoles;
    }
}