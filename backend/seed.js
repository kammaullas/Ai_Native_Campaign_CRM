const mongoose = require('mongoose');
const { fakerEN_IN: faker } = require('@faker-js/faker');
require('dotenv').config();

const Customer = require('./src/models/Customer');
const Order = require('./src/models/Order');

async function seedData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campaigniq';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding (Roast & Co.)');

    // Idempotent: check if customers already exist and drop them before re-seeding
    const customerCount = await Customer.countDocuments();
    if (customerCount > 0) {
      console.log(`Found ${customerCount} existing customers. Dropping old data to re-seed...`);
      await Customer.deleteMany({});
      await Order.deleteMany({});
    }

    const cities = [
      { name: 'Mumbai', weight: 0.35 },
      { name: 'Bangalore', weight: 0.35 },
      { name: 'Delhi', weight: 0.075 },
      { name: 'Hyderabad', weight: 0.075 },
      { name: 'Chennai', weight: 0.075 },
      { name: 'Pune', weight: 0.075 }
    ];

    const getCity = () => {
      const rand = Math.random();
      let sum = 0;
      for (const city of cities) {
        sum += city.weight;
        if (rand <= sum) return city.name;
      }
      return 'Pune';
    };

    const itemsList = ["Cold Brew", "Espresso", "Latte", "Filter Coffee", "Croissant", "Sandwich"];

    const cohorts = [
      { name: 'Loyal Regulars', count: 30, tags: ["VIP", "Loyal"], orderCount: [8, 20], spendRange: [8000, 25000], daysAgo: [0, 14] },
      { name: 'At-Risk', count: 40, tags: ["At-Risk", "Win-back"], orderCount: [3, 7], spendRange: [2000, 7000], daysAgo: [60, 120] },
      { name: 'One-Timers', count: 30, tags: ["New", "One-Timer"], orderCount: [1, 1], spendRange: [300, 1200], daysAgo: [30, 180] }
    ];

    const customersToInsert = [];
    const ordersToInsert = [];

    let loyalCount = 0;
    let atRiskCount = 0;
    let oneTimerCount = 0;

    for (const cohort of cohorts) {
      for (let i = 0; i < cohort.count; i++) {
        const customerId = new mongoose.Types.ObjectId();
        
        const orderCount = faker.number.int({ min: cohort.orderCount[0], max: cohort.orderCount[1] });
        
        // Let's generate order amounts first to strictly obey the 200-800 rule
        // However, if the user's totalSpend minimum bound exceeds what's possible (e.g. 20 * 800 = 16000, but min is 8000), 
        // we scale the orders to fit the requested spendRange.
        const targetSpend = faker.number.int({ min: cohort.spendRange[0], max: cohort.spendRange[1] });
        
        const minDaysAgo = new Date();
        minDaysAgo.setDate(minDaysAgo.getDate() - cohort.daysAgo[0]);
        const maxDaysAgo = new Date();
        maxDaysAgo.setDate(maxDaysAgo.getDate() - cohort.daysAgo[1]);
        
        const lastOrderDate = faker.date.between({ from: maxDaysAgo, to: minDaysAgo });

        customersToInsert.push({
          _id: customerId,
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: '+91' + faker.string.numeric(10),
          city: getCity(),
          totalSpend: targetSpend,
          orderCount: orderCount,
          lastOrderDate: lastOrderDate,
          tags: cohort.tags,
          createdAt: faker.date.past({ years: 1, refDate: lastOrderDate })
        });

        if (cohort.name === 'Loyal Regulars') loyalCount++;
        else if (cohort.name === 'At-Risk') atRiskCount++;
        else oneTimerCount++;

        let remainingSpend = targetSpend;
        let orderDateCursor = new Date(lastOrderDate);

        for (let j = 0; j < orderCount; j++) {
          let amount = (j === orderCount - 1) ? remainingSpend : Math.floor(remainingSpend / (orderCount - j));
          if (j !== orderCount - 1) {
             // add a bit of fuzziness
             const fuzzy = faker.number.int({ min: -50, max: 50 });
             amount += fuzzy;
          }
          
          remainingSpend -= amount;

          ordersToInsert.push({
            customerId: customerId,
            amount: amount,
            items: [{
              name: faker.helpers.arrayElement(itemsList),
              qty: 1,
              price: amount
            }],
            channel: faker.helpers.arrayElement(['online', 'offline']),
            createdAt: orderDateCursor,
            status: 'COMPLETED'
          });
          
          // Move order date backwards for the next historic order
          const offsetDays = faker.number.int({ min: 1, max: 14 });
          orderDateCursor = new Date(orderDateCursor.getTime() - offsetDays * 24 * 60 * 60 * 1000);
        }
      }
    }

    await Customer.insertMany(customersToInsert);
    await Order.insertMany(ordersToInsert);

    console.log(`Seeded ${loyalCount} loyal, ${atRiskCount} at-risk, ${oneTimerCount} one-timer customers.`);
    console.log('Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
