using Google.OrTools.Sat;

namespace Scheduling.Solver.Tests;

// OR-Tools'un yerel (native) kütüphanesinin bu makinede yüklenip çalıştığını doğrular.
public class OrToolsSmokeTests
{
    [Fact]
    public void CpSat_TinyModel_IsSolvedOptimally()
    {
        var model = new CpModel();
        var x = model.NewIntVar(0, 10, "x");
        var y = model.NewIntVar(0, 10, "y");
        model.Add(x + y == 7);
        model.Maximize(x);

        var solver = new CpSolver();
        var status = solver.Solve(model);

        Assert.Equal(CpSolverStatus.Optimal, status);
        Assert.Equal(7, solver.Value(x));
        Assert.Equal(0, solver.Value(y));
    }
}
