import { ApolloServer, gql, UserInputError } from "apollo-server"
import { v1 as uuid } from 'uuid'
import axios from 'axios'

// Definiendo el dataset
const persons = [
  {
    name: 'A1nz',
    age: '23',
    phone: '943235124',
    street: 'Calle Caminos del Ica',
    city: 'Chiclayo',
    id: '12335-45345-34123'
  },
  {
    name: 'Jrodas',
    phone: '984039123',
    street: 'Zaenz Peña # 310',
    city: 'Chiclayo',
    id: '93823-45367-99423'
  },
  {
    name: 'Lightning',
    street: 'Av. Proceres 530',
    city: 'Piura',
    id: '77321-99034-34123'
  }
]

// Definiendo los typos de graphql (graphql Schema)
const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    id: ID!
    address: Address!
    check: String!
    canDrink: Int!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(
      name: String!
      phone: String!
    ): Person
  }
`

// Como resolver las Queries
const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      const { data: personsFromRestApi } = await axios.get('http://localhost:3000/persons')
      console.log(personsFromRestApi)

      if (!args.phone) return personsFromRestApi
      const byPhone = person => 
        args.phone === "YES" ? person.phone : !person.phone

      return personsFromRestApi.filter(byPhone) 
    },
    findPerson: (root , args) => {
      const { name } = args
      return persons.find(person => person.name === name)
    }
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find(p => p.name === args.name)) {
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name
        })
      }

      const person = { ...args, id: uuid() }
      persons.push(person)
      return person
    },
    editNumber: (root, args) => {
      const personIndex = persons.findIndex(p => p.name === args.name)
      if (personIndex === -1) return null

      const person = persons[personIndex]

      const updatedPerson = {
        ...person,
        phone: args.phone
      }
      
      person[personIndex] = updatedPerson

      return updatedPerson
    }
  },
  Person: {
    canDrink: (root) => root.age > 18,
    // Address es un cálculo de información que ya tengo
    address: (root) => {
      return {
        street: root.street,
        city: root.city
      }
    },
    // Check es un dato estático
    check: () => 'A1nz'
  }
}

// Instanciando el servidor de apollo
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// Iniciamos el servidor
server.listen()
  .then(({ url }) => console.log(`Apollo Server ready at ${url}`))