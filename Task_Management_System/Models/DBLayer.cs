using Microsoft.Data.SqlClient;
using System.Data;

namespace Task_Management_System.Models
{
    public class DBLayer : IDBLayer
    {
        private readonly string? _con;
        public DBLayer(IConfiguration config)
        {
            _con = config.GetConnectionString("constr");
        }

        public async Task<int> ExecuteQueryAsync(string procname, SqlParameter[] parameter)
        {
            using SqlConnection conn = new SqlConnection(_con);
            using SqlCommand cmd = new SqlCommand(procname, conn);
            cmd.CommandType = CommandType.StoredProcedure;
            if (parameter != null)
            {
                cmd.Parameters.AddRange(parameter);
            }
            await conn.OpenAsync();
            int res = await cmd.ExecuteNonQueryAsync();
            return res;

        }

        public async Task<DataTable> TableAsync(string procname, SqlParameter[] parameters)
        {
            using SqlConnection conn = new SqlConnection(_con);
            using SqlCommand cmd = new SqlCommand(procname, conn);
            cmd.CommandType = CommandType.StoredProcedure;
            if (parameters != null)
            {
                cmd.Parameters.AddRange(parameters);
            }
            await conn.OpenAsync();
            using SqlDataReader reader = await cmd.ExecuteReaderAsync();
            DataTable dt = new DataTable();
            dt.Load(reader);
            return dt;
        }

        /* non async methods---
         
                public int ExecuteQuery(string procname, SqlParameter[] parameter)
                {
                    using SqlConnection conn = new SqlConnection(_con);
                    using SqlCommand cmd = new SqlCommand(procname, conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    if (parameter != null)
                    {
                        cmd.Parameters.AddRange(parameter);
                    }
                    conn.Open();
                    int res = cmd.ExecuteNonQuery();
                    return res;

                }

                public DataTable table(string procname, SqlParameter[] parameters)
                {
                    using SqlConnection conn = new SqlConnection(_con);
                    using SqlCommand cmd = new SqlCommand(procname, conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    if (parameters != null)
                    {
                        cmd.Parameters.AddRange(parameters);
                    }
                    DataTable dt = new DataTable();
                    using SqlDataAdapter sda = new SqlDataAdapter(cmd);
                    sda.Fill(dt);
                    return dt;
                }

         */
    }
}
