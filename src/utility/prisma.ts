import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const connectDb = async () => {
    try {
        // console.log(await prisma.)
        await prisma.$connect()
        console.log('Connected to database')
    } catch (error) {
        console.log('Error connecting to database: ', error)
    }
}

connectDb()

export default prisma
