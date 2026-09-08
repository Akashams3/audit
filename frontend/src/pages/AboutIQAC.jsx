import { useState, useEffect } from "react";
import { getCcmMembers, getCocmMembers } from "../api/endpoints";

function AboutIQAC() {
  const [members, setMembers] = useState({ ccm: [], cocm: [] });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const [ccm, cocm] = await Promise.all([
        getCcmMembers().catch(() => ({ data: { data: [] } })),
        getCocmMembers().catch(() => ({ data: { data: [] } }))
      ]);
      setMembers({ 
        ccm: ccm.data?.data || ccm.data || [], 
        cocm: cocm.data?.data || cocm.data || [] 
      });
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "IQAC", href: "/about-iqac", active: true },
    { name: "NAAC", href: "#" },
    { name: "Quality Initiatives", href: "#" },
    { name: "Meetings and ATRs", href: "#" },
    { name: "Quality Audits", href: "#" },
    { name: "Download Forms", href: "#" },
    { name: "IQAC Programmes", href: "#" },
    { name: "Rankings", href: "#" },
    { name: "NIRF", href: "#" },
    { name: "ARIIA", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-blue-900 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold uppercase tracking-wide">Internal Quality Assurance Cell (IQAC)</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white rounded shadow border border-gray-200">
            <ul className="flex flex-col">
              {navLinks.map((link, idx) => (
                <li key={idx} className="border-b last:border-0 border-gray-100">
                  <a 
                    href={link.href}
                    className={`block px-5 py-3 text-sm font-medium transition-colors ${
                      link.active 
                        ? 'bg-blue-900 text-white border-l-4 border-yellow-500' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-900 border-l-4 border-transparent'
                    }`}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white p-8 rounded shadow border border-gray-200">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b pb-2">About IQAC</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
              <p>
                The Internal Quality Assurance Cell (IQAC) was established in accordance with the guidelines of the National Assessment and Accreditation Council (NAAC) to develop a system for conscious, consistent, and catalytic action to improve the academic and administrative performance of the institution.
              </p>
              <p>
                IQAC acts as a nodal agency for coordinating quality-related activities, including adoption and dissemination of best practices, organization of workshops, and documentation of various programs leading to quality improvement.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 border-b pb-2">The Team</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Director</h3>
              <p className="text-gray-700 text-sm font-medium">Dr. S. Karthik Kumar, M.A., M.Phil., PhD.,</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Deputy Director</h3>
              <p className="text-gray-700 text-sm font-medium">Dr. R. LALITHA RAJA, M.A(Ling),M.A(Psy),Ph.D(Ling),B.Ed.,B.Ed. (Special Edn).,</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Faculty Co-ordinators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="p-3 bg-gray-50 rounded border">
                  <span className="font-bold text-blue-900 block mb-1">Arts</span>
                  Dr. M. Bharani, Assistant Professor of Philosophy
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <span className="font-bold text-blue-900 block mb-1">Science</span>
                  Dr. L. Vennila, Assistant Professor of Biochemistry and Biotechnology
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <span className="font-bold text-blue-900 block mb-1">Engineering & Technology</span>
                  Dr. T. Balamurali, Associate Professor of Chemical Engineering
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <span className="font-bold text-blue-900 block mb-1">Agriculture</span>
                  Dr. P. Thangavel, Professor of Genetics and Plant Breeding
                </div>
              </div>
            </div>
          </section>

          {/* Members Tables */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">Course Coordination Members (CCM)</h2>
            {members.ccm.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {members.ccm.map((member, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.name || member.facultyName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.role || "-"}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.className || member.courseName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.academicYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No CCM members available.</p>
            )}
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">Course Outcome Coordination Members (COCM)</h2>
            {members.cocm.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Designation</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {members.cocm.map((member, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.name || member.facultyName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.designation || "-"}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.role || "-"}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{member.academicYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No COCM members available.</p>
            )}
          </section>
        </main>
      </div>

      <footer className="bg-blue-900 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; 2024 Annamalai University IQAC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AboutIQAC;
