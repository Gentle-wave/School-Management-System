const User = require('../models/User');
const School = require('../models/School');
const Classroom = require('../models/Classroom');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const { ROLES } = require('../libs/constants');

class SeedLoader {
  constructor({ cache }) {
    this.cache = cache;
    this.seedFlagKey = 'seeds:executed';
  }

  async shouldRunSeeds() {
    // Check if seeds have already been executed
    const executed = await this.cache.string.get({ key: this.seedFlagKey });
    if (executed === 'true') {
      return false;
    }

    // Also check database for seed flag
    const SeedFlag = mongoose.connection.collection('seed_flags');
    const flag = await SeedFlag.findOne({ name: 'seeds_executed' });
    if (flag && flag.executed === true) {
      return false;
    }

    return true;
  }

  async markSeedsExecuted() {
    await this.cache.string.set({
      key: this.seedFlagKey,
      data: 'true',
      ttl: 86400 * 365, // 1 year
    });

    // Also store in database
    const SeedFlag = mongoose.connection.collection('seed_flags');
    await SeedFlag.updateOne(
      { name: 'seeds_executed' },
      { $set: { executed: true, executedAt: new Date() } },
      { upsert: true }
    );
  }

  async clearDatabase() {
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await School.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});
    const SeedFlag = mongoose.connection.collection('seed_flags');
    await SeedFlag.deleteMany({});
    await this.cache.string.delete({ key: this.seedFlagKey });
    console.log('✅ Database cleared');
  }

  async seed() {
    try {
      const shouldRun = await this.shouldRunSeeds();
      if (!shouldRun) {
        console.log('ℹ️  Seeds have already been executed. Skipping...');
        return;
      }

      console.log('🌱 Starting database seeding...');

      // Clear existing data first (for fresh start)
      await this.clearDatabase();

      // Seed users
      const users = await this._seedUsers();

      // Seed schools
      const schools = await this._seedSchools();

      // Seed classrooms
      const classrooms = await this._seedClassrooms(schools);

      // Seed students
      await this._seedStudents(schools, classrooms);

      // Mark seeds as executed
      await this.markSeedsExecuted();

      console.log('✅ Database seeding completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Users: ${users.length}`);
      console.log(`   - Schools: ${schools.length}`);
      console.log(`   - Classrooms: ${classrooms.length}`);
      console.log(`   - Students: Check database`);
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  async _seedUsers() {
    console.log('👤 Seeding users...');
    const users = [
      {
        email: 'superadmin@schoolsystem.com',
        password: 'SuperAdmin123!',
        role: ROLES.SUPERADMIN,
        schoolId: null,
        isActive: true,
      },
      {
        email: 'admin@lincoln.edu',
        password: 'Admin123!',
        role: ROLES.SCHOOL_ADMINISTRATOR,
        isActive: true,
      },
      {
        email: 'admin@washington.edu',
        password: 'Admin123!',
        role: ROLES.SCHOOL_ADMINISTRATOR,
        isActive: true,
      },
      {
        email: 'admin@roosevelt.edu',
        password: 'Admin123!',
        role: ROLES.SCHOOL_ADMINISTRATOR,
        isActive: true,
      },
      {
        email: 'inactive@schoolsystem.com',
        password: 'Inactive123!',
        role: ROLES.SCHOOL_ADMINISTRATOR,
        isActive: false,
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  }

  async _seedSchools() {
    console.log('🏫 Seeding schools...');
    const schools = [
      {
        name: 'Lincoln High School',
        address: {
          street: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA',
        },
        contact: {
          phone: '217-555-0100',
          email: 'info@lincoln.edu',
        },
        isActive: true,
        metadata: {
          established: '1990',
          type: 'Public',
        },
      },
      {
        name: 'Washington Elementary School',
        address: {
          street: '456 Oak Avenue',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          country: 'USA',
        },
        contact: {
          phone: '217-555-0200',
          email: 'info@washington.edu',
        },
        isActive: true,
        metadata: {
          established: '1985',
          type: 'Public',
        },
      },
      {
        name: 'Roosevelt Middle School',
        address: {
          street: '789 Elm Street',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
        },
        contact: {
          phone: '312-555-0300',
          email: 'info@roosevelt.edu',
        },
        isActive: true,
        metadata: {
          established: '2000',
          type: 'Public',
        },
      },
      {
        name: 'Inactive School',
        address: {
          street: '999 Closed Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62703',
          country: 'USA',
        },
        contact: {
          phone: '217-555-9999',
          email: 'info@inactive.edu',
        },
        isActive: false,
      },
    ];

    const createdSchools = await School.insertMany(schools);
    console.log(`✅ Created ${createdSchools.length} schools`);

    // Update school administrators with their school IDs
    const User = require('../models/User');
    await User.updateOne(
      { email: 'admin@lincoln.edu' },
      { $set: { schoolId: createdSchools[0]._id } }
    );
    await User.updateOne(
      { email: 'admin@washington.edu' },
      { $set: { schoolId: createdSchools[1]._id } }
    );
    await User.updateOne(
      { email: 'admin@roosevelt.edu' },
      { $set: { schoolId: createdSchools[2]._id } }
    );

    return createdSchools;
  }

  async _seedClassrooms(schools) {
    console.log('📚 Seeding classrooms...');
    const classrooms = [];

    // Lincoln High School classrooms
    const lincolnSchool = schools.find(s => s.name === 'Lincoln High School');
    if (lincolnSchool) {
      const lincolnClassrooms = [
        {
          name: 'Math 101',
          schoolId: lincolnSchool._id,
          capacity: 30,
          currentEnrollment: 0,
          gradeLevel: '9',
          resources: {
            projector: 'Yes',
            computers: '15',
            whiteboard: 'Yes',
          },
          isActive: true,
        },
        {
          name: 'English 201',
          schoolId: lincolnSchool._id,
          capacity: 25,
          currentEnrollment: 0,
          gradeLevel: '10',
          resources: {
            projector: 'Yes',
            computers: '10',
            whiteboard: 'Yes',
          },
          isActive: true,
        },
        {
          name: 'Science Lab A',
          schoolId: lincolnSchool._id,
          capacity: 20,
          currentEnrollment: 0,
          gradeLevel: '11',
          resources: {
            labEquipment: 'Full',
            computers: '20',
            safetyEquipment: 'Yes',
          },
          isActive: true,
        },
        {
          name: 'Full Capacity Room',
          schoolId: lincolnSchool._id,
          capacity: 15,
          currentEnrollment: 15,
          gradeLevel: '12',
          resources: {},
          isActive: true,
        },
        {
          name: 'Inactive Classroom',
          schoolId: lincolnSchool._id,
          capacity: 20,
          currentEnrollment: 0,
          gradeLevel: '9',
          isActive: false,
        },
      ];
      const created = await Classroom.insertMany(lincolnClassrooms);
      classrooms.push(...created);
    }

    // Washington Elementary School classrooms
    const washingtonSchool = schools.find(s => s.name === 'Washington Elementary School');
    if (washingtonSchool) {
      const washingtonClassrooms = [
        {
          name: 'Kindergarten A',
          schoolId: washingtonSchool._id,
          capacity: 20,
          currentEnrollment: 0,
          gradeLevel: 'K',
          resources: {
            toys: 'Yes',
            books: '100+',
          },
          isActive: true,
        },
        {
          name: 'Grade 1 - Room 101',
          schoolId: washingtonSchool._id,
          capacity: 22,
          currentEnrollment: 0,
          gradeLevel: '1',
          resources: {
            computers: '5',
            books: '200+',
          },
          isActive: true,
        },
        {
          name: 'Grade 2 - Room 102',
          schoolId: washingtonSchool._id,
          capacity: 24,
          currentEnrollment: 0,
          gradeLevel: '2',
          isActive: true,
        },
      ];
      const created = await Classroom.insertMany(washingtonClassrooms);
      classrooms.push(...created);
    }

    // Roosevelt Middle School classrooms
    const rooseveltSchool = schools.find(s => s.name === 'Roosevelt Middle School');
    if (rooseveltSchool) {
      const rooseveltClassrooms = [
        {
          name: 'Math 6A',
          schoolId: rooseveltSchool._id,
          capacity: 28,
          currentEnrollment: 0,
          gradeLevel: '6',
          resources: {
            projector: 'Yes',
            computers: '28',
          },
          isActive: true,
        },
        {
          name: 'Science 7B',
          schoolId: rooseveltSchool._id,
          capacity: 26,
          currentEnrollment: 0,
          gradeLevel: '7',
          resources: {
            labEquipment: 'Basic',
            computers: '26',
          },
          isActive: true,
        },
        {
          name: 'History 8C',
          schoolId: rooseveltSchool._id,
          capacity: 30,
          currentEnrollment: 0,
          gradeLevel: '8',
          resources: {
            projector: 'Yes',
            books: '50+',
          },
          isActive: true,
        },
      ];
      const created = await Classroom.insertMany(rooseveltClassrooms);
      classrooms.push(...created);
    }

    console.log(`✅ Created ${classrooms.length} classrooms`);
    return classrooms;
  }

  async _seedStudents(schools, classrooms) {
    console.log('🎓 Seeding students...');
    const students = [];

    const lincolnSchool = schools.find(s => s.name === 'Lincoln High School');
    const washingtonSchool = schools.find(s => s.name === 'Washington Elementary School');
    const rooseveltSchool = schools.find(s => s.name === 'Roosevelt Middle School');

    const math101 = classrooms.find(c => c.name === 'Math 101');
    const english201 = classrooms.find(c => c.name === 'English 201');
    const scienceLabA = classrooms.find(c => c.name === 'Science Lab A');
    const fullCapacityRoom = classrooms.find(c => c.name === 'Full Capacity Room');
    const kindergartenA = classrooms.find(c => c.name === 'Kindergarten A');
    const grade1 = classrooms.find(c => c.name === 'Grade 1 - Room 101');
    const math6A = classrooms.find(c => c.name === 'Math 6A');

    // Lincoln High School students
    if (lincolnSchool) {
      const lincolnStudents = [
        {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('2007-05-15'),
          schoolId: lincolnSchool._id,
          classroomId: math101?._id,
          contact: {
            email: 'john.doe@example.com',
            phone: '217-555-1001',
            guardianName: 'Jane Doe',
            guardianPhone: '217-555-1002',
          },
          address: {
            street: '100 Student Lane',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
          },
          isActive: true,
        },
        {
          firstName: 'Sarah',
          lastName: 'Smith',
          dateOfBirth: new Date('2006-08-20'),
          schoolId: lincolnSchool._id,
          classroomId: english201?._id,
          contact: {
            email: 'sarah.smith@example.com',
            phone: '217-555-1003',
            guardianName: 'Robert Smith',
            guardianPhone: '217-555-1004',
          },
          isActive: true,
        },
        {
          firstName: 'Michael',
          lastName: 'Johnson',
          dateOfBirth: new Date('2005-03-10'),
          schoolId: lincolnSchool._id,
          classroomId: scienceLabA?._id,
          contact: {
            email: 'michael.johnson@example.com',
            phone: '217-555-1005',
            guardianName: 'Mary Johnson',
            guardianPhone: '217-555-1006',
          },
          isActive: true,
        },
        {
          firstName: 'Emily',
          lastName: 'Williams',
          dateOfBirth: new Date('2004-11-25'),
          schoolId: lincolnSchool._id,
          classroomId: null, // Not enrolled in any classroom
          contact: {
            email: 'emily.williams@example.com',
            phone: '217-555-1007',
            guardianName: 'David Williams',
            guardianPhone: '217-555-1008',
          },
          isActive: true,
        },
        {
          firstName: 'Inactive',
          lastName: 'Student',
          dateOfBirth: new Date('2007-01-01'),
          schoolId: lincolnSchool._id,
          classroomId: null,
          isActive: false,
        },
      ];
      students.push(...lincolnStudents);
    }

    // Washington Elementary School students
    if (washingtonSchool) {
      const washingtonStudents = [
        {
          firstName: 'Emma',
          lastName: 'Brown',
          dateOfBirth: new Date('2018-09-01'),
          schoolId: washingtonSchool._id,
          classroomId: kindergartenA?._id,
          contact: {
            email: 'emma.brown@example.com',
            phone: '217-555-2001',
            guardianName: 'Lisa Brown',
            guardianPhone: '217-555-2002',
          },
          isActive: true,
        },
        {
          firstName: 'James',
          lastName: 'Davis',
          dateOfBirth: new Date('2017-04-15'),
          schoolId: washingtonSchool._id,
          classroomId: grade1?._id,
          contact: {
            email: 'james.davis@example.com',
            phone: '217-555-2003',
            guardianName: 'Tom Davis',
            guardianPhone: '217-555-2004',
          },
          isActive: true,
        },
        {
          firstName: 'Olivia',
          lastName: 'Miller',
          dateOfBirth: new Date('2016-12-10'),
          schoolId: washingtonSchool._id,
          classroomId: grade1?._id,
          contact: {
            email: 'olivia.miller@example.com',
            phone: '217-555-2005',
            guardianName: 'Susan Miller',
            guardianPhone: '217-555-2006',
          },
          isActive: true,
        },
      ];
      students.push(...washingtonStudents);
    }

    // Roosevelt Middle School students
    if (rooseveltSchool) {
      const rooseveltStudents = [
        {
          firstName: 'Noah',
          lastName: 'Wilson',
          dateOfBirth: new Date('2012-06-20'),
          schoolId: rooseveltSchool._id,
          classroomId: math6A?._id,
          contact: {
            email: 'noah.wilson@example.com',
            phone: '312-555-3001',
            guardianName: 'Patricia Wilson',
            guardianPhone: '312-555-3002',
          },
          isActive: true,
        },
        {
          firstName: 'Ava',
          lastName: 'Moore',
          dateOfBirth: new Date('2011-02-14'),
          schoolId: rooseveltSchool._id,
          classroomId: math6A?._id,
          contact: {
            email: 'ava.moore@example.com',
            phone: '312-555-3003',
            guardianName: 'Christopher Moore',
            guardianPhone: '312-555-3004',
          },
          isActive: true,
        },
      ];
      students.push(...rooseveltStudents);
    }

    // Insert students and update classroom enrollments
    for (const studentData of students) {
      const student = new Student(studentData);
      await student.save();

      if (student.classroomId) {
        await Classroom.updateOne(
          { _id: student.classroomId },
          { $inc: { currentEnrollment: 1 } }
        );
      }
    }

    console.log(`✅ Created ${students.length} students`);
    return students;
  }
}

module.exports = SeedLoader;
