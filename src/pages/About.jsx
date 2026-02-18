function About() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-3">About Us</h1>
      <p className="text-gray-600 mb-8">
        Learn about Apsara, our mission, and our team.
      </p>

      {/* Section 1: Mission */}
      <div className="p-6 border rounded-xl shadow-sm bg-white mb-8">
        <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          At Apsara, we preserve the tradition of handcrafted art by creating
          premium sculptures made by skilled Khmer artisans. Every piece reflects
          the beauty, culture, and heritage of Cambodia.
        </p>
      </div>

      {/* Section 2: What We Do */}
      <div className="p-6 border rounded-xl shadow-sm bg-white mb-8">
        <h2 className="text-xl font-semibold mb-2">What We Do</h2>
        <p className="text-gray-600 leading-relaxed">
          We specialize in custom and ready-made sculptures carved from wood,
          stone, and metal. Whether it's traditional Apsara figures, modern art
          pieces, or personalized designs, our goal is to bring your vision to
          life with precision and passion.
        </p>
      </div>

      {/* Section 3: Team */}
      <div className="p-6 border rounded-xl shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-2">Our Team</h2>
        <p className="text-gray-600 leading-relaxed">
          Our team consists of experienced craftsmen and designers dedicated to
          preserving Cambodian artistry. Each sculpture is made with care,
          respect, and deep appreciation for our culture.
        </p>
      </div>
    </div>
  );
}

export default About;

